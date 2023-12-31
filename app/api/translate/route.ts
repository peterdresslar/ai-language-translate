import anthropicProvider from './providers/anthropic';
import openaiProvider from './providers/openai';
import replicateProvider from './providers/replicate';

import { StreamingTextResponse } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // eventually we will unify modelConfig with the cartridge system
    const { translateMode, input, modelConfigId, inputOpts } = await req.json();
    const inputLang = translateMode.split("To")[0];
    const outputLang = translateMode.split("To")[1];
    console.log("inputLang: " + inputLang + " outputLang: " + outputLang + " input: " + input + " modelConfigId: " + modelConfigId + " inputOpts: " + JSON.stringify(inputOpts));

    if (modelConfigId === undefined) {
      // Handle error
      return new Response("", {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
        statusText: 'Sorry, something went wrong...'
      });
    } else {
      let stream;
      
      // conditions should be based on cartridge.provider. Providers would be identified by a string, e.g. 'replicate', 'openai', 'anthropic'
      if (modelConfigId === 0 || modelConfigId === 1) {
        // OpenAI provider, which should return a stream'
        stream = await openaiProvider(modelConfigId, input, inputLang, outputLang, inputOpts);
      } else if (modelConfigId === 2) {
        //type our stream as a ReplicateStream
        stream = await replicateProvider(modelConfigId, input, inputLang, outputLang, inputOpts);
      } else if (modelConfigId === 3) {
        // Claude provider, which should return a stream
        stream = await anthropicProvider(modelConfigId, input, inputLang, outputLang, inputOpts);
      } else {
        // Handle error
        // Ideally all the providers will have a common response mode on failure, and we would unify that here
        // Basically we need let stream turn into a StreamingTextResponse on success or a Response on failure
      }

      // Create HTTP Response with the stream, if it exists
      if (stream) {
        return new StreamingTextResponse(stream);
      } else {
        // Handle error
        return new Response("", {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
          statusText: 'Sorry, something went wrong with the model provider.'
        });
      }
    }
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as any).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
