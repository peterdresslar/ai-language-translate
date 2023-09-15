// ../providers/replicate.ts
import Replicate from 'replicate';
import { ReplicateStream, StreamingTextResponse } from 'ai';

import { cartridges } from "@/lib/data"
import { Cartridge } from "@/lib/Cartridge";
import { InputOpts } from '@/lib/InputOpts';
import getSystemPromptStub from '../helpers/systemPrompts'

export const runtime = 'edge';

export default async function replicateProvider(
    cartridgeId: number,
    input: string,
    inputLang: string,
    outputLang: string,
    //inputOpts should be InputOpts or null
    inputOpts: InputOpts | null
) {

    const replicate = new Replicate({
        auth: process.env.REPLICATE_API_KEY || '',
    });

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
            const systemPrompt = getSystemPromptStub(inputLang, outputLang, translateFlavor, translateExplain);

            // Ask Replicate for a streaming chat completion given the prompt
            const prediction = await replicate.predictions.create({
                // Llama-70b-chat
                version: providerOpts.versionId as string, // will break if null
                input: {
                    prompt: input,
                    system_prompt: systemPrompt,
                    max_new_tokens: providerOpts.maxTokens,
                    temperature: providerOpts.temperature,
                    top_p: providerOpts.topP,
                    repetition_penalty: providerOpts.repetitionPenalty
                    // verbose: true
                },
                stream: true,
            });
            const stream = await ReplicateStream(prediction);
            return stream;
        }
    }
}