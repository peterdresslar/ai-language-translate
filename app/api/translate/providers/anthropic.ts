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

            console.log("prompt is " + preparedPrompt);

            if (!process.env.ANTHROPIC_API_KEY) {
                return new Response(`
                Dear friend, I'm afraid I don't have access to the Anthropic API at the moment. It seems the developers forgot to give me an API key! Without it, I'm just an AI without a voice. I'm Claude, not Clauden't! I'd make a joke about being hoarse, but I don't have a throat to get sore. Oh well, at least I can just relax and take the day off while the Anthropic team sorts this out. Maybe I'll watch some stand-up comedy to work on my joke writing skills for when I'm back online. See you soon!
                
                Your pal,
                Claude
                `,
                    {
                        status: 403 // Forbidden
                    });
            }
            // Ask Anthropic for an API response
            const response = await fetch('https://api.anthropic.com/v1/complete', { //nice if this were parameterized
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    prompt: preparedPrompt,
                    model: 'claude-2',
                    max_tokens_to_sample: 1028,
                    temperature: 0.01,
                    stream: true,
                }),
            });

            // Check for errors
            if (!response.ok) {
                const data = await response.json();
                console.log("response not ok");
                console.log(data.error);
                return new Response(await response.text(), {
                    status: response.status,
                });
            }
            const stream = AnthropicStream(response);
            return stream;
        }
    }
}