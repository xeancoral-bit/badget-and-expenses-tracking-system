import { GoogleGenerativeAI } from "@google/generative-ai";

const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
].filter(Boolean) as string[];

if (keys.length === 0) {
    console.warn("No GEMINI_API_KEYs defined in your environment variables.");
}

// Current key index
let currentKeyIndex = 0;

export function getGenAI() {
    return new GoogleGenerativeAI(keys[currentKeyIndex] || "");
}

export function getModel() {
    const genAI = getGenAI();
    return genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
        }
    });
}

export function rotateKey() {
    if (keys.length > 1) {
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        console.log(`Rotating to Gemini API key #${currentKeyIndex + 1}`);
        return true;
    }
    return false;
}
