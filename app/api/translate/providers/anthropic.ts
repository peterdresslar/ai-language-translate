// ../providers/replicate.ts
import Replicate from 'replicate';
import { AnthropicStream, StreamingTextResponse } from 'ai';

import { cartridges } from "@/lib/data"
import { Cartridge } from "@/lib/Cartridge";
import { InputOpts } from '@/lib/InputOpts';
import { getClaudePromptStub } from '../helpers/systemPrompts'

export const runtime = 'edge';

export default async function anthropicProvider(
    cartridgeId: number,
    input: string,
    inputLang: string,
    outputLang: string,
    //inputOpts should be InputOpts or null
    inputOpts: InputOpts | null
) {

    const apiKey = process.env.ANTHROPIC_API_KEY;

    const cartridge = cartridges.find((c: Cartridge) => c.id === cartridgeId);
    if (!cartridge) {
        //the whole system is not great if this happens
        throw new Error('Cartridge not found');
    } else {
        const providerOpts = cartridge.providerOpts;
        console.log("providerOpts: " + JSON.stringify(providerOpts));

        if (inputOpts === null) {
            // Handle error
            throw new Error('Sorry, something went wrong with inputs');
        } else {
            const translateFlavor = inputOpts.translateFlavor;
            const translateExplain = inputOpts.translateExplain;

            // Note we are not yet constructing systemPrompt with more detail.
            // This will eventually be a function of the cartridge and the user's settings.
            // e.g., const systemPrompt = await getSystemPrompt(cartridge, translateFlavor, isExplain);
            const claudePrompt = getClaudePromptStub(inputLang, outputLang, translateFlavor, translateExplain);
            const preparedPrompt = `\n\nHuman: ${claudePrompt}: ${input}\n\nAssistant: `

            if (!process.env.ANTHROPIC_API_KEY) {
                throw new Error('Sorry, API Key not found or not working.');
            } 
            // Ask Anthropic for an API response
            console.log(providerOpts.modelName);
        console.log(JSON.stringify({
            prompt: preparedPrompt,
                    model: providerOpts.modelName, // will break if null
                    max_tokens_to_sample: providerOpts.temperature, // will break if null
                    temperature: providerOpts.temperature,
                    stream: providerOpts.stream,
        }));

            const response = await fetch('https://api.anthropic.com/v1/complete', { //nice if this were parameterized
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    prompt: preparedPrompt,
                    model: providerOpts.modelName, // will break if null
                    max_tokens_to_sample: providerOpts.maxTokens, // will break if null
                    temperature: providerOpts.temperature,
                    stream: providerOpts.stream,
                }),
            });

            // Check for errors
            if (!response.ok) {
                console.log(response.statusText); 
                console.log(response.status);
                throw new Error('Sorry, something went wrong with the API call.');
            }
            const stream = AnthropicStream(response);
            return stream;
        }
    }
}