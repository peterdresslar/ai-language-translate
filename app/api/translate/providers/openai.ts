// ../providers/replicate.ts
import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

import { cartridges } from "@/lib/data"
import { Cartridge, ProviderOpts } from "@/lib/Cartridge";
import { InputOpts } from '@/lib/InputOpts';
import { getSystemPromptStub } from '../helpers/systemPrompts'

export const runtime = 'edge';

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function openaiProvider(
    cartridgeId: number,
    input: string,
    inputLang: string,
    outputLang: string,
    //inputOpts should be InputOpts or null
    inputOpts: InputOpts | null
) {

    const cartridge = cartridges.find((c: Cartridge) => c.id === cartridgeId);
    if (!cartridge) {
        //the whole system is not great if this happens
        throw new Error('Cartridge not found');
    } else {
        const providerOpts: ProviderOpts = cartridge.providerOpts;

        if (inputOpts === null) {
            // Handle error
            throw new Error('Sorry, something went wrong with inputs');
        } else {
            const translateFlavor = inputOpts.translateFlavor;
            const translateExplain = inputOpts.translateExplain;
            const sysContent = getSystemPromptStub(inputLang, outputLang, translateFlavor, translateExplain);

            // Ask OpenAI for a streaming chat completion given the prompt
            const response = await openai.chat.completions.create({
                model: providerOpts.modelName as string, // will break if null
                messages: [{ role: 'user', content: input }, { role: 'system', content: sysContent }],
                stream: true,
                temperature: providerOpts.temperature as number, // will break if null
                max_tokens: providerOpts.maxTokens as number, // will break if null
                frequency_penalty: providerOpts.frequencyPenalty as number, // will break if null
            });
            const stream = OpenAIStream(response);
            return stream;
        }
    }
}