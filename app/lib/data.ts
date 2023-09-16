import { Cartridge } from "./Cartridge";

export const cartridges: Cartridge[] = [
    { 
        id: 0,
        provider: 'openai',
        label: 'OpenAI GPT-4',
        description: 'OpenAI GPT-4',
        sysPrompt: 'not yet implemented',
        cartridgeStatus: 'active',
        providerOpts: {
            modelName: 'gpt-4',
            temperature: 0.1,
            streaming: true,
            maxTokens: 2056,
            topP: 1.0,
            repetitionPenalty: -2.0
        }
    },
    { // gpt-3.5-turbo
        id: 1,
        provider: 'openai',
        label: 'OpenAI GPT-3.5',
        description: 'OpenAI GPT-3.5',
        sysPrompt: 'not yet implemented',
        cartridgeStatus: 'active',
        providerOpts: {
            modelName: 'gpt-3.5-turbo',
            temperature: 0.1,
            streaming: true,
            maxTokens: 2056,
            topP: 1.0,
            frequencyPenalty: -2.0
        }
    },
    { // Llama-70b
        id: 2,
        provider: 'replicate',
        label: 'Meta Llama 2 70B (can be slow!)',
        description: 'Meta Llama 2 70B (can be slow!)',
        sysPrompt: 'not yet implemented',
        cartridgeStatus: 'active',
        providerOpts: {
            versionId: '2796ee9483c3fd7aa2e171d38f4ca12251a30609463dcfd4cd76703f22e96cdf',
            temperature: 0.01,
            streaming: true,
            maxTokens: 1028,
            topP: 1.0,
            repetitionPenalty: 1.0
        }
    },
    { // Claude!
        id: 3,
        provider: 'anthropic',
        label: 'Claude',
        description: 'Claude!',
        sysPrompt: 'not yet implemented',
        cartridgeStatus: 'active',
        providerOpts: {
            modelName: 'claude-v1',
            max_tokens_to_sample: 1028,
            temperature: 0.01,
            stream: true,
        }
    }   
];

//leaving this in for the front end to continue to work
//TODO refactor to use the Cartridge class
export const modelConfigData = [
    { modelConfigId: 0, modelConfigName: 'gpt4', modelConfigLabel: 'OpenAI GPT-4', modelName: 'gpt-4', temperature: 0.1, streaming: false, maxTokens: 2056 },
    { modelConfigId: 1, modelConfigName: 'gpt35', modelConfigLabel: 'OpenAI GPT-3.5', modelName: 'gpt-3.5-turbo', temperature: 0.1, streaming: false, maxTokens: 2056 },
    { modelConfigId: 2, modelConfigName: 'llama270', modelConfigLabel: 'Meta Llama 2 70B (can be slow!)', modelName: 'Llama70b', temperature: 0.01, streaming: false, maxTokens: 1028 },
    { modelConfigId: 3, modelConfigName: 'claude', modelConfigLabel: 'Claude', modelName: 'claude-v1', temperature: 0.01, streaming: false, maxTokens: 1028 }
];

export const languageOptionData = [
    { value: 'englishToSamoan', label: 'English to Samoan' },
    { value: 'samoanToEnglish', label: 'Samoan to English' },
    { value: 'englishToChamorro', label: 'English to Chamorro' },
    { value: 'chamorroToEnglish', label: 'Chamorro to English' }
];


// label is the language ISO-639-1 code, unless the language doesn't have one, then it's the ISO-639-2 code.
// if the language doesn't have the ISO-639-2 code, then it's the English name of the language.
export const languageKeys = [
    { value: 'English', label: 'En' },
    { value: 'Samoan', label: 'Sm' },
    { value: 'Chamorro', label: 'Ch' },
    { value: 'Carolinian', label: 'Cal' }
];