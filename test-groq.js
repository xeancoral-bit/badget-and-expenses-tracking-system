require('dotenv').config();
const apiKey = process.env.GROQ_API_KEY;

fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: "Say hi" },
            { role: "user", content: "Hello" }
        ],
        temperature: 1,
        max_completion_tokens: 8192,
        top_p: 1
    })
})
.then(res => res.json())
.then(data => console.log("Response:", JSON.stringify(data, null, 2)))
.catch(err => console.error("Fetch Error:", err));
