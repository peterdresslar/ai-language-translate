// See nextjs-langchain-example


import { ChatOpenAI } from 'langchain/chat_models/openai';
import { LLMChain } from 'langchain/chains';
import { CallbackManager } from 'langchain/callbacks';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
} from 'langchain/prompts';

export async function POST(req: Request) {
  try {
    const { translateMode, input } = await req.json();
    console.log('translateMode', translateMode);
    console.log('input', input);
    // If translateMode is toSamoan, then we need to form an inputRequest that includes asking nicely for the translation to Samoan. The converse is true if translateMode is toEnglish.
    // Using ternary operator to do this.
    const request = (translateMode === "toSamoan") ?
      'Please Translate to Samoan: ' + input :
      'Please Translate to English: ' + input;
    console.log('request', request);
    const prompt = ChatPromptTemplate.fromPromptMessages([
      HumanMessagePromptTemplate.fromTemplate('{request}'),
    ]);
    // Check if the request is for a streaming response.
    const streaming = req.headers.get('accept') === 'text/event-stream';
    console.log('server streaming', streaming);
    if (streaming) {
      // For a streaming response we need to use a TransformStream to
      // convert the LLM's callback-based API into a stream-based API.
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      console.log('creating llm');
      const llm = new ChatOpenAI({
        streaming,
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
      chain.call({ request }).catch((e: Error) => console.error(e));
      console.log('returning response');
      return new Response(stream.readable, {
        headers: { 'Content-Type': 'text/event-stream' },
      });
    } else {
      // For a non-streaming response we can just await the result of the
      // chain.run() call and return it.
      const llm = new ChatOpenAI();
      const chain = new LLMChain({ prompt, llm });
      const response = await chain.call({ input });

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
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
