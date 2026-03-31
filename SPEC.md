# AI-Powered Budget & Expense Tracking System

## Project Overview

**Project Name:** SmartBudget AI  
**Project Type:** Full-stack Web Application (Next.js)  
**Core Functionality:** An intelligent budget and expense tracking system where users can manage finances through an interactive UI and natural-language AI chat. The AI autonomously categorizes transactions, computes budgets, and provides financial insights.  
**Target Users:** Individual users seeking smart, automated personal finance management without administrative overhead.

---

## Technology Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS
- **Database:** SQLite with better-sqlite3 (secure local storage)
- **AI Integration:** Model Context Protocol (MCP) with AI models
- **State Management:** React Context + useReducer
- **Real-time Updates:** Server-Sent Events (SSE)

---

## UI/UX Specification

### Layout Structure

**Main Layout:**
- Fixed sidebar navigation (280px width)
- Main content area with header
- AI Chat panel (collapsible, right side)

**Page Sections:**
1. Dashboard (default)
2. Transactions
3. Budgets
4. Analytics
5. AI Chat (floating)

**Responsive Breakpoints:**
- Mobile: < 768px (sidebar becomes hamburger menu)
- Tablet: 768px - 1024px (collapsed sidebar)
- Desktop: > 1024px (full sidebar)

### Visual Design

**Color Palette:**
- Primary: `#0F172A` (slate-900) - Main backgrounds
- Secondary: `#1E293B` (slate-800) - Cards/panels
- Accent: `#10B981` (emerald-500) - Positive/income
- Warning: `#F59E0B` (amber-500) - Expenses/alerts
- Danger: `#EF4444` (red-500) - Errors/negative
- Text Primary: `#F8FAFC` (slate-50)
- Text Secondary: `#94A3B8` (slate-400)
- Border: `#334155` (slate-700)

**Typography:**
- Font Family: 'Inter', system-ui, sans-serif
- Headings: 
  - H1: 32px, font-weight: 700
  - H2: 24px, font-weight: 600
  - H3: 18px, font-weight: 600
- Body: 14px, font-weight: 400
- Small: 12px, font-weight: 400

**Spacing System:**
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px

**Visual Effects:**
- Card shadows: `0 4px 6px -1px rgba(0, 0, 0, 0.3)`
- Hover transitions: 150ms ease-in-out
- Border radius: 8px (cards), 6px (buttons), 4px (inputs)
- Glassmorphism effect on AI chat panel

### Components

**Navigation Sidebar:**
- Logo at top
- Nav items with icons
- Active state: emerald-500 background with opacity
- Hover: subtle background change

**Tab Navigation:**
- Horizontal tabs within pages
- Active: bottom border accent
- Smooth transition between tabs

**Buttons:**
- Primary: emerald-500 background, white text
- Secondary: transparent with border
- Danger: red-500 background
- All buttons: 150ms hover transition, slight scale on active

**Input Forms:**
- Dark background (#1E293B)
- Border on focus (emerald-500)
- Label above input
- Error state: red border with message

**Cards:**
- Background: #1E293B
- Border: 1px solid #334155
- Padding: 24px
- Border-radius: 8px

**AI Chat:**
- Floating panel (right side)
- Glassmorphism background
- Message bubbles (user: right, AI: left)
- Input at bottom with send button

---

## Database Schema

### Tables

**users**
- id: INTEGER PRIMARY KEY
- name: TEXT NOT NULL
- email: TEXT UNIQUE NOT NULL
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

**accounts**
- id: INTEGER PRIMARY KEY
- user_id: INTEGER FOREIGN KEY
- name: TEXT NOT NULL
- type: TEXT (checking, savings, credit, cash)
- balance: REAL DEFAULT 0
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

**categories**
- id: INTEGER PRIMARY KEY
- name: TEXT NOT NULL
- type: TEXT (income, expense)
- icon: TEXT
- color: TEXT

**transactions**
- id: INTEGER PRIMARY KEY
- user_id: INTEGER FOREIGN KEY
- account_id: INTEGER FOREIGN KEY
- category_id: INTEGER FOREIGN KEY
- amount: REAL NOT NULL
- type: TEXT (income, expense)
- description: TEXT
- date: DATETIME NOT NULL
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

**budgets**
- id: INTEGER PRIMARY KEY
- user_id: INTEGER FOREIGN KEY
- category_id: INTEGER FOREIGN KEY
- amount: REAL NOT NULL
- period: TEXT (monthly, weekly)
- start_date: DATE
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

**chat_messages**
- id: INTEGER PRIMARY KEY
- user_id: INTEGER FOREIGN KEY
- role: TEXT (user, assistant)
- content: TEXT
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

---

## Functionality Specification

### Core Features

**1. Dashboard**
- Total balance overview
- Recent transactions (last 5)
- Budget status indicators
- Quick action buttons
- AI-generated insight of the day

**2. Transaction Management**
- Add new transaction (income/expense)
- Edit existing transactions
- Delete transactions
- Filter by date, category, account
- Search transactions
- Auto-categorization by AI

**3. Budget Management**
- Create budget by category
- Set budget limits (weekly/monthly)
- Track spending against budget
- Alerts when approaching limit
- AI suggestions for budget optimization

**4. Account Management**
- Multiple account support
- Account types (checking, savings, credit, cash)
- Transfer between accounts
- Balance history

**5. AI Chat Interface**
- Natural language queries
- Ask about finances: "How much did I spend on food this month?"
- Get insights: "What are my spending patterns?"
- Add transactions via chat: "Add $50 grocery expense"
- Budget recommendations

**6. Analytics**
- Spending by category (pie chart)
- Income vs Expense (bar chart)
- Monthly trends (line chart)
- Category breakdown
- AI-powered insights and recommendations

### AI Capabilities

**Transaction Categorization:**
- Automatically categorize based on description
- Learn from user corrections
- Categories: Food, Transport, Shopping, Bills, Entertainment, Health, Income, etc.

**Financial Insights:**
- Spending patterns analysis
- Budget recommendations
- Savings suggestions
- Anomaly detection
- Monthly summaries

**Natural Language Processing:**
- Parse natural language transactions
- Extract amount, category, date from text
- Answer financial queries
- Provide contextual recommendations

---

## API Endpoints

### REST API

**Transactions:**
- GET /api/transactions - List transactions
- POST /api/transactions - Create transaction
- PUT /api/transactions/[id] - Update transaction
- DELETE /api/transactions/[id] - Delete transaction

**Accounts:**
- GET /api/accounts - List accounts
- POST /api/accounts - Create account
- PUT /api/accounts/[id] - Update account
- DELETE /api/accounts/[id] - Delete account

**Budgets:**
- GET /api/budgets - List budgets
- POST /api/budgets - Create budget
- PUT /api/budgets/[id] - Update budget
- DELETE /api/budgets/[id] - Delete budget

**Categories:**
- GET /api/categories - List categories
- POST /api/categories - Create category

**AI Chat:**
- POST /api/chat - Send message to AI
- GET /api/chat/history - Get chat history

**Analytics:**
- GET /api/analytics/summary - Get financial summary
- GET /api/analytics/spending - Get spending breakdown

---

## Acceptance Criteria

### Visual Checkpoints
- [ ] Dark theme applied consistently
- [ ] Sidebar navigation functional
- [ ] Tab navigation works smoothly
- [ ] All forms have proper validation
- [ ] Responsive on mobile/tablet/desktop
- [ ] AI chat panel opens/closes properly
- [ ] Charts render correctly

### Functional Checkpoints
- [ ] Can add income/expense transactions
- [ ] Transactions auto-categorized by AI
- [ ] Balances update in real-time
- [ ] Budgets track spending correctly
- [ ] AI chat responds to queries
- [ ] Can add transactions via chat
- [ ] Analytics show correct data
- [ ] All CRUD operations work

### AI Checkpoints
- [ ] Transaction categorization works
- [ ] Natural language parsing accurate
- [ ] Financial insights generated
- [ ] Budget recommendations provided
- [ ] No admin involvement required
