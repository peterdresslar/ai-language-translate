export default function getSystemPromptStub(inputLang: string, outputLang: string, translateFlavor: string, translateExplain: boolean): string {
    console.log("here comes a prompt for " + inputLang + " to " + outputLang + " with flavor " + translateFlavor + " and explain " + translateExplain)
    const systemPromptRoot = `You always respond with the best translation from ${inputLang} to ${outputLang} you can generate. If there is a mix of languages in the user prompt you do your best to translate it all to ${outputLang}. You do not add commentary, but simply supply the best translation you can.`;
    const systemPrompt = `${systemPromptRoot}
    
Please use a ${translateFlavor} tone. ${translateExplain ? "Please explain your translation decisions in detail (in English)." : "Please do not explain your translation--deliver only translated text."}`;
    return systemPrompt;
}