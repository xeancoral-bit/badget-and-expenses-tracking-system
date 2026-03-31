-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('checking', 'savings', 'credit', 'cash')),
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    icon TEXT,
    color TEXT
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    period TEXT NOT NULL CHECK(period IN ('monthly', 'weekly')),
    start_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Categories (Optional, but good for default state)
INSERT INTO categories (name, type, icon, color) VALUES 
('Food & Dining', 'expense', 'utensils', '#F59E0B'),
('Transportation', 'expense', 'car', '#3B82F6'),
('Shopping', 'expense', 'shopping-bag', '#EC4899'),
('Bills & Utilities', 'expense', 'zap', '#8B5CF6'),
('Entertainment', 'expense', 'film', '#10B981'),
('Health & Medical', 'expense', 'heart', '#EF4444'),
('Education', 'expense', 'book-open', '#06B6D4'),
('Personal Care', 'expense', 'user', '#F97316'),
('Groceries', 'expense', 'shopping-cart', '#84CC16'),
('Other Expenses', 'expense', 'more-horizontal', '#6B7280'),
('Salary', 'income', 'briefcase', '#10B981'),
('Freelance', 'income', 'laptop', '#3B82F6'),
('Investments', 'income', 'trending-up', '#8B5CF6'),
('Business', 'income', 'building', '#EC4899'),
('Gifts', 'income', 'gift', '#F59E0B'),
('Other Income', 'income', 'plus-circle', '#6B7280')
ON CONFLICT DO NOTHING;
