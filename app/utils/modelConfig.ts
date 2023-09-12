import { modelConfigData } from '../lib/data';

export type ModelConfig = {
    modelConfigId: number;
    modelConfigName: string;
    modelConfigLabel: string;
    modelName: string;
    temperature: number;
    streaming: boolean;
    maxTokens: number;
};

//import data, then export it all as modelConfigs
export const modelConfigs: ModelConfig[] = [
    ...modelConfigData
];

export const getModelConfigById = (id: number): ModelConfig | undefined => {
    return modelConfigs.find(config => config.modelConfigId === id);
};