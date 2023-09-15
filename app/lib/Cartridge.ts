interface ProviderOpts {
    [key: string]: number | string | boolean;
}

export interface Cartridge {
    id: number;
    provider: string;
    providerOpts: ProviderOpts;
    label: string;
    description: string;
    sysPrompt: string;
    cartridgeStatus: 'active' | 'deprecated' | 'testing';
}