export type TranslateFlavor = 'formal' | 'business' | 'casual';

export interface InputOpts {
    translateFlavor: TranslateFlavor;
    translateExplain: boolean;
}
