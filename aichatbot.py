import os
import json
from groq import Groq
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("Warning: GROQ_API_KEY not found in .env. Please add it to start using the chatbot.")

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = Groq(api_key=GROQ_API_KEY)

def get_financial_context():
    """Fetch current financial state to provide as context to the AI."""
    try:
        # Get total balance and summary
        # Note: This assumes a 'transactions' table exists as per your Next.js project
        res = supabase.table('transactions').select('*').execute()
        transactions = res.data or []
        
        balance = sum(t['amount'] if t['type'] == 'income' else -t['amount'] for t in transactions)
        expenses = sum(t['amount'] for t in transactions if t['type'] == 'expense')
        income = sum(t['amount'] for t in transactions if t['type'] == 'income')
        
        return f"User Balance: ₱{balance:,.2f} | Monthly Income: ₱{income:,.2f} | Monthly Expenses: ₱{expenses:,.2f}"
    except Exception as e:
        return "Context: Database connection pending or schema mismatch."

def run_chat(user_message):
    context = get_financial_context()
    
    completion = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {
                "role": "system",
                "content": f"You are SmartBudget AI. Help the user manage their finances. Context: {context}"
            },
            {
                "role": "user",
                "content": user_message
            }
        ],
        temperature=1,
        max_completion_tokens=8192,
        top_p=1,
        stream=True,
        stop=None
    )

    print("\nAI Chatbot: ", end="")
    for chunk in completion:
        if chunk.choices[0].delta.content:
            print(chunk.choices[0].delta.content, end="", flush=True)
    print("\n")

if __name__ == "__main__":
    print("--- SmartBudget AI (Groq Engine) ---")
    while True:
        msg = input("You: ")
        if msg.lower() in ['exit', 'quit']:
            break
        run_chat(msg)
