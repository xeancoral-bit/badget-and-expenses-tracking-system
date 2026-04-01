import { getFinancialSummary, getSpendingByCategory, getMonthlyTrends, getBudgets, getAccounts, getCategories, createTransaction, addChatMessage, getChatHistory } from './db';
import type { AIInsight, TransactionFormData } from './types';

// Process chat message and generate AI response using Gemini
export async function processChatMessage(userId: number, message: string): Promise<{ response: string; action?: string; data?: any }> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return { 
                response: "AI is not connected. Please set a valid GEMINI_API_KEY in your .env file to start chatting." 
            };
        }

        // 1. Gather context data
        const [summary, budgets, accounts, history, categories] = await Promise.all([
            getFinancialSummary(userId),
            getBudgets(userId),
            getAccounts(userId),
            getChatHistory(userId, 10),
            getCategories()
        ]);

        const incomeCategories = categories.filter((c: any) => c.type === 'income');
        const expenseCategories = categories.filter((c: any) => c.type === 'expense');

        // 2. Prepare system prompt
        const systemPrompt = `You are "SmartBudget AI", a highly capable financial strategist and assistant.
Your goal is to help the user manage their finances by answering questions, providing insights, and automating transaction tracking.

CURRENT FINANCIAL CONTEXT:
- Total Balance: ₱${summary.totalBalance.toLocaleString()}
- Monthly Income: ₱${summary.totalIncome.toLocaleString()}
- Monthly Expenses: ₱${summary.totalExpenses.toLocaleString()}
- Savings Rate: ${summary.savingsRate.toFixed(1)}%
- Active Accounts: ${accounts.map((a: any) => `${a.name} (₱${a.balance})`).join(', ')}
- Budget Status: ${budgets.map((b: any) => `${b.category_name}: ₱${b.spent}/${b.amount}`).join(', ')}

AVAILABLE CATEGORIES:
- Income: ${incomeCategories.map((c: any) => c.name).join(', ')}
- Expense: ${expenseCategories.map((c: any) => c.name).join(', ')}

CAPABILITIES:
1. TRACKING: You can add transactions. If the user mentions spending or earning money, identify the amount, type (income/expense), category, and description.
2. INSIGHTS: Analyze spending trends, budget status, and recommend optimizations.
3. CONVERSATION: Be helpful, professional, and encouraging. Use ₱ for currency.

RESPONSE FORMAT:
You MUST respond with a JSON object in the following format:
{
  "response": "Your natural language response to the user",
  "action": "transaction_added" | null,
  "transaction_data": {
    "amount": number,
    "type": "income" | "expense",
    "description": "string",
    "category_name": "string",
    "account_id": number
  } | null
}

RULES:
- If adding a transaction, pick the closest matching category from the lists above.
- Default to the first account (ID: ${accounts[0]?.id || 1}) if not specified.
- Keep the natural language response concise and friendly.
- If no transaction is being added, set "action" and "transaction_data" to null.
- Always respond in valid JSON.`;


        // 3. Call Groq via REST API (OpenAI Compatible)
        let content = '{}';
        
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "llama3-70b-8192",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history.map((m: any) => ({
                        role: m.role === 'assistant' ? 'assistant' : 'user',
                        content: m.content
                    })),
                    { role: "user", content: message }
                ],
                temperature: 1,
                max_completion_tokens: 8192,
                top_p: 1
            })
        });

        if (!groqResponse.ok) {
            const error = await groqResponse.json();
            throw new Error(`Groq API Error: ${JSON.stringify(error)}`);
        }

        const data = await groqResponse.json();
        content = data.choices[0]?.message?.content || '{}';

        const aiResult = JSON.parse(content);
        const { response, action, transaction_data } = aiResult;

        // 4. Handle Actions
        let finalAction = action;
        let finalData = null;

        if (action === 'transaction_added' && transaction_data) {
            // Find category ID
            const allCats = await getCategories(transaction_data.type);
            const category = allCats.find((c: any) => 
                c.name.toLowerCase() === transaction_data.category_name.toLowerCase() ||
                transaction_data.category_name.toLowerCase().includes(c.name.toLowerCase()) ||
                c.name.toLowerCase().includes(transaction_data.category_name.toLowerCase())
            );

            if (category) {
                const transactionData: TransactionFormData = {
                    account_id: transaction_data.account_id || accounts[0]?.id || 1,
                    amount: transaction_data.amount,
                    type: transaction_data.type,
                    description: transaction_data.description,
                    category_id: category.id,
                    date: new Date().toISOString().split('T')[0]
                };

                await createTransaction(userId, transactionData);
                finalData = transactionData;
            } else {
                // If category not found, still add to "Other"
                const otherCat = allCats.find((c: any) => c.name.toLowerCase().includes('other')) || allCats[0];
                const transactionData: TransactionFormData = {
                    account_id: transaction_data.account_id || accounts[0]?.id || 1,
                    amount: transaction_data.amount,
                    type: transaction_data.type,
                    description: transaction_data.description,
                    category_id: otherCat.id,
                    date: new Date().toISOString().split('T')[0]
                };
                await createTransaction(userId, transactionData);
                finalData = transactionData;
            }
        }

        // 5. Store conversation
        await addChatMessage(userId, 'user', message);
        await addChatMessage(userId, 'assistant', response);

        return {
            response,
            action: finalAction,
            data: finalData
        };

    } catch (error: any) {
        console.error('Gemini AI Error:', error);
        
        // Fallback or specific error handling
        if (error.message?.includes('GROQ_API_KEY')) {
            const response = "I'm sorry, but my AI engine is not configured yet. Please set the GROQ_API_KEY in the environment.";
            await addChatMessage(userId, 'assistant', response);
            return { response };
        }

        await addChatMessage(userId, 'user', message);
        const fallbackResponse = "I encountered an error processing your request. Please try again or check your internet connection.";
        await addChatMessage(userId, 'assistant', fallbackResponse);
        return { response: fallbackResponse };
    }
}

// Generate AI-powered financial insights
export async function generateInsights(userId: number): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const summary = await getFinancialSummary(userId);
    const budgets = (await getBudgets(userId)) as any[];
    const spending = (await getSpendingByCategory(userId)) as any[];

    // Check budget warnings
    budgets.forEach(budget => {
        const percentage = budget.amount > 0 ? ((budget.spent || 0) / budget.amount) * 100 : 0;

        if (percentage >= 100) {
            insights.push({
                id: `budget-${budget.id}-over`,
                type: 'warning',
                title: `Over Budget: ${budget.category_name}`,
                description: `You've exceeded your ${budget.category_name} budget by ₱${((budget.spent || 0) - budget.amount).toFixed(2)}. Consider reducing spending in this category.`,
                category: budget.category_name
            });
        } else if (percentage >= 80) {
            insights.push({
                id: `budget-${budget.id}-warning`,
                type: 'warning',
                title: `Budget Warning: ${budget.category_name}`,
                description: `You've used ${percentage.toFixed(0)}% of your ${budget.category_name} budget. You have ₱${(budget.amount - (budget.spent || 0)).toFixed(2)} remaining.`,
                category: budget.category_name
            });
        }
    });

    // Savings rate insights
    if (summary.savingsRate < 0) {
        insights.push({
            id: 'savings-negative',
            type: 'warning',
            title: 'Negative Savings Rate',
            description: 'Your expenses exceed your income this month. Review your spending to get back on track.'
        });
    } else if (summary.savingsRate > 20) {
        insights.push({
            id: 'savings-great',
            type: 'info',
            title: 'Great Savings Rate!',
            description: `You're saving ${summary.savingsRate.toFixed(1)}% of your income this month. Keep up the great work!`
        });
    } else if (summary.savingsRate < 10) {
        insights.push({
            id: 'savings-low',
            type: 'suggestion',
            title: 'Low Savings Rate',
            description: `Your savings rate is ${summary.savingsRate.toFixed(1)}%. Consider reducing discretionary expenses to increase savings.`
        });
    }

    // Top spending category
    if (spending.length > 0) {
        const topCategory = spending[0];
        if (topCategory.percentage > 30) {
            insights.push({
                id: 'spending-top',
                type: 'suggestion',
                title: `High Spending: ${topCategory.category}`,
                description: `${topCategory.category} accounts for ${topCategory.percentage.toFixed(1)}% of your total spending. Look for ways to reduce costs in this category.`
            });
        }
    }

    // General spending insight
    if (spending.length === 0 && summary.totalExpenses > 0) {
        insights.push({
            id: 'spending-start',
            type: 'info',
            title: 'Start Tracking',
            description: 'Start categorizing your expenses to get personalized insights and budget recommendations.'
        });
    }

    return insights;
}

// Get AI-powered suggestions for budget optimization
export async function getBudgetSuggestions(userId: number): Promise<string[]> {
    const suggestions: string[] = [];
    const budgets = (await getBudgets(userId)) as any[];
    const spending = (await getSpendingByCategory(userId)) as any[];
    const summary = await getFinancialSummary(userId);

    // Analyze spending patterns
    if (spending.length > 0) {
        const topSpending = spending.slice(0, 3);

        // Check if categories are over budget
        budgets.forEach(budget => {
            const categorySpending = spending.find(s => s.category === budget.category_name);
            if (!categorySpending) {
                suggestions.push(`Set up a budget for ${budget.category_name} - you haven't spent anything in this category yet.`);
            }
        });

        // Suggest budgets for high spending categories without budgets
        topSpending.forEach(s => {
            const hasBudget = budgets.some(b => b.category_name === s.category);
            if (!hasBudget && s.amount > 100) {
                suggestions.push(`Consider setting a monthly budget for ${s.category} - you've spent ₱${s.amount.toFixed(2)} this month.`);
            }
        });
    }

    // Savings suggestions
    if (summary.savingsRate < 20) {
        suggestions.push('Try the 50/30/20 budget rule: 50% needs, 30% wants, 20% savings.');
    }

    // Income-based suggestions
    if (summary.totalIncome > 0 && budgets.length < 3) {
        suggestions.push('Create budgets for your top spending categories to track expenses better.');
    }

    if (suggestions.length === 0) {
        suggestions.push('Your budget is well set up! Keep tracking your expenses for better financial health.');
    }

    return suggestions.slice(0, 4);
}
