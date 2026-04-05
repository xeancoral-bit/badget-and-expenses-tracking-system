# 🚀 SmartBudget AI - Deployment Guide

This document contains instructions to deploy your **SmartBudget AI** financial tracking system.

## 1. Environment Variables (CRITICAL)
For the AI and Dashboard to function, you **MUST** add these to your hosting provider (e.g., Vercel, Netlify):

| Variable | Source | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | Main DB URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | Frontend database access |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings | AI's master database access (bypasses RLS) |
| `GROQ_API_KEY` | Groq Console | Powers the AI Chatbot |

> [!IMPORTANT]
> Ensure `SUPABASE_SERVICE_ROLE_KEY` is kept private and never used on the client side. The AI service uses it in `src/lib/ai-service.ts`.

## 2. Deployment Steps

### Vercel (Recommended)
1.  **Connect Repo**: Import your GitHub repository to Vercel.
2.  **Add Envs**: Copy the variables above from your `.env` to the Vercel "Environment Variables" section.
3.  **Deploy**: Vercel will automatically detect **Next.js** and build the optimized production version.

### Manual Build (Local Check)
To check if your system is ready for production, run:
```bash
npm run build
```
The system has been audited for **Zero Errors and Zero Warnings** as of `Sunday, April 5, 2026`.

## 3. Post-Deployment Checks
- [ ] **AI Chatbot**: Open the chat and ask "What is my total balance?". It should return the same balance as the Dashboard.
- [ ] **Data Connection**: Add a transaction via the AI. Ensure the Dashboard and Sidebar update immediately.
- [ ] **Analytics**: Verify the "Spending Distribution" shows up correctly in the Analytics tab.

---
*SmartBudget AI: Master Your Finances with Intelligence.*
