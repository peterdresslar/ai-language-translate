import { ChatOpenAI } from 'langchain/chat_models/openai';
import { LLMChain } from 'langchain/chains';
import { CallbackManager } from 'langchain/callbacks';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from 'langchain/prompts';
import Replicate from 'replicate';
import { ReplicateStream, StreamingTextResponse } from 'ai';


import type { ModelConfig } from '../../ModelConfig';

export const runtime = 'edge';

//I expect we will move these to different routes
async function resolveModelConfig(modelConfigId: number) {
  let c;
  try {
    if (modelConfigId == 2) {
      c = '{"modelConfigId": 2, "configName": "GPT-3.5-turbo default settings", "modelName": "gpt-3.5-turbo", "temperature": 0, "streaming": true, "maxTokens": 2000}';
    } else if (modelConfigId == 3) { // LLama/Replicate
      c = '{"modelConfigId": 3, "configName": "LLama-Replicate default settings", "modelName": "Llama70b", "temperature": 0, "streaming": true, "maxTokens": 2000}';
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
      // else if one of the two OpenAI modelconfigs
    } else if (modelConfig.modelName === 'gpt-4' || modelConfig.modelName === 'gpt-3.5-turbo') {
      console.log("modelConfig is defined with name " + modelConfig.modelName);
      // set input language and output language from our translateMode. translateMode can be one of four options: englishToSamoan, samoanToEnglish, chamorroToEnglish, englishToChamorro
      // can split the string on "To" and then use the first and second parts to set the input and output languages
      const inputLang = translateMode.split("To")[0];
      const outputLang = translateMode.split("To")[1];

      const prompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(
          "You are a language translator that translates {input_language} to {output_language} as precisely as possible. Even though you do not know Samoan or Chamorro very well, you do your best when one of these is a target language. Please only respond with the translated text. No commentary is requested or desired. Thank you."
        ),
        HumanMessagePromptTemplate.fromTemplate('{text}'),
      ]);
      // For a streaming response we need to use a TransformStream to
      // convert the LLM's callback-based API into a stream-based API.
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
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

    } else if (modelConfig.modelName === 'Llama70b') { // Completely different path for Replicate for now. Using Vercel ai package since we couldn't get the handle on langchain/replicate
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_KEY || '',
      });
      console.log("modelConfig is defined with name " + modelConfig.modelName);
      const inputLang = (translateMode === 'toSamoan') ? 'English' : 'Samoan';
      const outputLang = (translateMode === 'toSamoan') ? 'Samoan' : 'English';
      const systemPrompt = "You are a professional translator. You always translate " + inputLang + " to " + outputLang + ". Even if you are not comfortable with your Samoan or Chamorro language skills, you do your very best. Please only respond with the translated text. No commentary is requested or desired. Thank you.";

      // Ask Replicate for a streaming chat completion given the prompt
      const prediction = await replicate.predictions.create({
        // Llama-70b-chat
        version: '2796ee9483c3fd7aa2e171d38f4ca12251a30609463dcfd4cd76703f22e96cdf',
        input: {
          prompt: input,
          system_prompt: systemPrompt,
         // verbose: true
        },
        stream: true,
      });
      const stream = await ReplicateStream(prediction);
      return new StreamingTextResponse(stream);

    } else { // this means we do not have a model. should not reach
      console.log("Something went wrong. modelConfig.modelName is " + modelConfig.modelName);
      return;
    }

  } catch (e) {
    console.log('error using key ' + process.env.OPENAI_API_KEY);
    console.error(e);
    return new Response(JSON.stringify({ error: (e as any).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

}

