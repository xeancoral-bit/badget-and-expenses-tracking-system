
import { processChatMessage } from './src/lib/ai-service.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function simulate() {
    console.log('--- Simulating Chat Message: "add income 200" ---');
    try {
        const result = await processChatMessage(1, "add income 200", "gemini");
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error during simulation:', error);
    }
}

simulate();
