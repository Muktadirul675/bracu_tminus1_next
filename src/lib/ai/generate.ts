import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { SYSTEM_PROMPT } from './prompt';

export async function aiResponse(data: any) {
    const { text } = await generateText({
        model: groq('openai/gpt-oss-120b'),
        prompt: `INPUT: ${JSON.stringify(data)}`,
        system: SYSTEM_PROMPT,
    });
    return text;
}

