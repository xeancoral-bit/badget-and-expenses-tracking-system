import { GoogleGenerativeAI } from "@google/generative-ai";
import { getFinancialSummary, getSpendingByCategory, getMonthlyTrends, getBudgets, getAccounts, getCategories, createTransaction, addChatMessage, getChatHistory } from './db';
import type { AIInsight, TransactionFormData } from './types';

// Process chat message and generate AI response
export async function processChatMessage(userId: number, message: string): Promise<{ response: string; action?: string; data?: any }> {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;
        
        if (!groqKey && !geminiKey) {
            return { 
                response: "AI connectivity is missing. Please check your GEMINI_API_KEY or GROQ_API_KEY in the environment." 
            };
        }

        // 1. Gather context data
        const [summary, budgets, accounts, history, categories, spending, trends] = await Promise.all([
            getFinancialSummary(userId),
            getBudgets(userId),
            getAccounts(userId),
            getChatHistory(userId, 10),
            getCategories(),
            getSpendingByCategory(userId),
            getMonthlyTrends(userId, 6)
        ]);

        // 2. Prepare system prompt
        const systemPrompt = `You are "SmartBudget AI", a master financial strategist.
You are directly connected to the user's Dashboard, Transactions, Budgets, and Analytics modules.

FINANCIAL CONTEXT:
- Monthly Income: ₱${summary.totalIncome.toLocaleString()}
- Monthly Expenses: ₱${summary.totalExpenses.toLocaleString()}
- Total Balance: ₱${summary.totalBalance.toLocaleString()}
- Savings Rate: ${summary.savingsRate.toFixed(1)}%
- Categories: ${categories.map((c: any) => c.name).join(', ')}
- Accounts: ${accounts.map((a: any) => `${a.name} (₱${a.balance})`).join(', ')}

PROTOCOL:
- Respond in VALID JSON ONLY.
- Structure: { "response": "string", "action": string|null, "transaction_data": object|null }
- For finance queries, use the exact numbers above.`;

        let aiResult: any = { 
            response: "I'm having trouble connecting to my AI core. Please ensure your GEMINI_API_KEY or GROQ_API_KEY is correctly set in your Vercel project settings.", 
            action: null, 
            transaction_data: null 
        };

        // 3. Try Gemini first (Optimized for Vercel)
        if (geminiKey) {
            try {
                const genAI = new GoogleGenerativeAI(geminiKey);
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-1.5-flash",
                    systemInstruction: systemPrompt,
                    generationConfig: { responseMimeType: "application/json" }
                });

                const chatHistory = history.map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }));

                const chat = model.startChat({ history: chatHistory });
                const result = await chat.sendMessage(message);
                const text = result.response.text();
                
                // Robust parsing: Clean markdown code blocks if present
                const cleanJson = text.replace(/```json|```/g, '').trim();
                aiResult = JSON.parse(cleanJson);
            } catch (geminiError: any) {
                console.error("Gemini failed:", geminiError.message);
                if (!groqKey) {
                    aiResult.response = `Gemini connection error: ${geminiError.message || "Unknown error"}. Please check your Gemini API key.`;
                }
            }
        }

        // 4. Try Groq (Fallback)
        if ((!aiResult.response || aiResult.response.includes("having trouble")) && groqKey) {
            try {
                const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${groqKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        response_format: { type: "json_object" },
                        messages: [
                            { role: "system", content: systemPrompt },
                            ...history.map((m: any) => ({
                                role: m.role === 'assistant' ? 'assistant' : 'user',
                                content: m.content
                            })),
                            { role: "user", content: message }
                        ],
                        temperature: 0.1,
                    })
                });

                if (groqResponse.ok) {
                    const groqData = await groqResponse.json();
                    const content = groqData.choices[0]?.message?.content || '{}';
                    const cleanJson = content.replace(/```json|```/g, '').trim();
                    aiResult = JSON.parse(cleanJson);
                } else {
                    const errorData = await groqResponse.json();
                    aiResult.response = `Groq API returned an error: ${errorData.error?.message || "Unknown error"}.`;
                }
            } catch (groqError: any) {
                console.error("Groq fallback failed:", groqError.message);
                aiResult.response = `AI connection failed (both Gemini and Groq). Error: ${groqError.message}`;
            }
        }
        
        const response = aiResult.response || "I've processed your request.";
        const action = aiResult.action || null;
        const transaction_data = aiResult.transaction_data || null;

        // 4. Handle Actions
        let finalAction: string | undefined = undefined;
        let finalData: any = undefined;

        if (action === 'transaction_added' && transaction_data && transaction_data.amount) {
            try {
                const transType = transaction_data.type || 'expense';
                const allCats = await getCategories(transType);
                const categoryName = transaction_data.category_name || (transType === 'income' ? 'Salary' : 'Other');
                
                const category = allCats.find((c: any) => 
                    c.name.toLowerCase() === categoryName.toLowerCase() ||
                    categoryName.toLowerCase().includes(c.name.toLowerCase()) ||
                    c.name.toLowerCase().includes(categoryName.toLowerCase())
                );

                const finalCategoryId = category ? category.id : (allCats.find((c: any) => c.name.toLowerCase().includes('other'))?.id || allCats[0]?.id || (transType === 'income' ? 1 : 10));

                const transactionData: TransactionFormData = {
                    account_id: transaction_data.account_id || accounts[0]?.id || 1,
                    amount: Math.abs(transaction_data.amount),
                    type: transType as 'income' | 'expense',
                    description: transaction_data.description || `AI Added ${transType}`,
                    category_id: finalCategoryId,
                    date: new Date().toISOString().split('T')[0]
                };

                await createTransaction(userId, transactionData);
                finalAction = 'transaction_added';
                finalData = transactionData;
            } catch (actError) {
                console.error("Action handler failed:", actError);
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
