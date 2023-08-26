export type ModelConfig = { 
    modelConfigId: number;
    configName: string;
    modelName: string;
    temperature: number;
    streaming: boolean;
    maxTokens: number;
}