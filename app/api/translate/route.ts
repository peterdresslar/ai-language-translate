import { ChatOpenAI } from 'langchain/chat_models/openai';
import { LLMChain } from 'langchain/chains';
import { CallbackManager } from 'langchain/callbacks';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from 'langchain/prompts';

import type { ModelConfig } from '../../ModelConfig';

// TODO how do we call the other route from this API route most efficiently?
// call configs/getOne(modelConfigId) to get the modelConfig from the database
async function resolveModelConfig(modelConfigId: number) {
  let c;
  try {
    if (modelConfigId == 2) {
      c = '{"modelConfigId": 2, "configName": "GPT-3.5-turbo default settings", "modelName": "gpt-3.5-turbo", "temperature": 0, "streaming": true, "maxTokens": 2000}';
    } else if (modelConfigId == 3) { // LLama/Replicate
      c = '{"modelConfigId": 3, "configName": "LLama/Replicate default settings", "modelName": Llama70b", "temperature": 0, "streaming": true, "maxTokens": 2000}';
    } else { // default to GPT-4
       c = '{"modelConfigId": 1, "configName": "GPT-4 default settings", "modelName": "gpt-4", "temperature": 0, "streaming": true, "maxTokens": 2000}';
    }
    const mC: ModelConfig = JSON.parse(c);
    return mC;
  } catch (error) {
    console.log("error fetching modelConfig for modelConfigId ${modelConfigId}");
    return undefined;
  }
}

export async function POST(req: Request) {
  try {
    const { translateMode, input, modelConfigId } = await req.json();
    console.log('translateMode', translateMode);
    console.log('input', input);
    console.log('modelConfigId', modelConfigId);
    const modelConfig = await resolveModelConfig(modelConfigId);
    if (modelConfig === undefined) {
      //do something to handle this error
      console.log("modelConfig is undefined");
      return new Response("", {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
        statusText: 'Sorry, something went wrong when trying to access that AI model. Please try another model. If you continue to have problems, please contact us.'
      });
    } else {
      console.log("modelConfig is defined with name " + modelConfig.modelName);
      const inputLang = (translateMode === 'toSamoan') ? 'English' : 'Samoan'; //yes, there are more sophisticated ways to do this
      const outputLang = (translateMode === 'toSamoan') ? 'Samoan' : 'English';
      const prompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(
          "You are a language translator that translates '{input_language}' to '{output_language}' as precisely as possible."
        ),
        HumanMessagePromptTemplate.fromTemplate('{text}'),
      ]);
      // For a streaming response we need to use a TransformStream to
      // convert the LLM's callback-based API into a stream-based API.
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      console.log('creating llm');
      const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        streaming: true,
        temperature: modelConfig.temperature,
        modelName: modelConfig.modelName,
        maxTokens: modelConfig.maxTokens,
        callbackManager: CallbackManager.fromHandlers({
          handleLLMNewToken: async (token: string) => {
            await writer.ready;
            await writer.write(encoder.encode(`data: ${token}\n\n`));
          },
          handleLLMEnd: async () => {
            await writer.ready;
            await writer.close();
          },
          handleLLMError: async (e: Error) => {
            await writer.ready;
            await writer.abort(e);
          },
        }),
      });
      console.log('creating chain');
      const chain = new LLMChain({ prompt, llm });
      // We don't need to await the result of the chain.run() call because
      // the LLM will invoke the callbackManager's handleLLMEnd() method
      chain.call({
        input_language: inputLang,
        output_language: outputLang,
        text: input
      }).catch((e: Error) => console.error(e));
      console.log('returning response');
      return new Response(stream.readable, {
        headers: { 'Content-Type': 'text/event-stream' },
      });

    }
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as any).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

}

export const runtime = 'edge';
