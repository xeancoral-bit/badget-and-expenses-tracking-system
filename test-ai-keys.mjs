
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
dotenv.config();

async function testGemini() {
    console.log('--- Testing Gemini ---');
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
        console.error('GEMINI_API_KEY is missing');
        return;
    }
    try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        // Try flash-latest
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Hello, say 'Gemini Flash Latest is working'");
        console.log('Gemini Flash Latest Response:', result.response.text());
    } catch (err) {
        console.error('Gemini Flash Latest Error:', err.message);
    }
}

async function testGroq() {
    console.log('\n--- Testing Groq ---');
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
        console.error('GROQ_API_KEY is missing');
        return;
    }
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: "Hello, say 'Groq is working'" }],
                max_tokens: 20
            })
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Groq Response:', data.choices[0].message.content);
        } else {
            const err = await response.json();
            console.error('Groq Error:', err.error.message);
        }
    } catch (err) {
        console.error('Groq Network Error:', err.message);
    }
}

async function runTests() {
    await testGemini();
    await testGroq();
}

runTests();
