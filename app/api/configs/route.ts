import { get } from "http";


async function getOne(modelConfigId: number) {
    if (modelConfigId == 1) {
        return `{
            "modelConfigId": 1,
            "configName": "GPT-4 default settings",
            "modelName": "GPT-4",
            "temperature": 0,
            "streaming": true,
            "maxTokens": 2000,}`};
    if (modelConfigId == 2) {
        return `{
            "modelConfigId": 2,
            "configName": "GPT-3.5-turbo default settings",
            "modelName": "GPT-3.5-turbo",
            "temperature": 0,
            "streaming": true,
            "maxTokens": 2000,}`};
    // by default return the first modelConfig
    return `{
        "modelConfigId": 1,
        "configName": "GPT-4 default settings",
        "modelName": "GPT-4",
        "temperature": 0,
        "streaming": true,
        "maxTokens": 2000,}`;
}


async function getAll() {
    return `[
        {   "modelConfigId": 1,
            "configName": "GPT-4 default settings",
            "modelName": "GPT-4",
            "temperature": 0,
            "streaming": true,
            "maxTokens": 2000,},
        {   "modelConfigId": 2,
            "configName": "GPT-3.5-turbo default settings",
            "modelName": "GPT-3.5-turbo",
            "temperature": 0,
            "streaming": true,
            "maxTokens": 2000,}
        ]`;
}

export async function POST(req: Request) {
    // this API will return a requested modelConfig or a list of all modelConfigs.
    // if no modelConfigId is specified, return a list of all modelConfigs
    const { modelConfigId } = await req.json();
    try {
        if (modelConfigId) { 
            console.log("Request for modelConfigId: " + modelConfigId + " received.");
            // Call a function to pull the modelConfig from the database
            const config = await(getOne(modelConfigId));
            return new Response(JSON.stringify(config), {
                headers: { 'Content-Type': 'application/json' },
              });
    }
    else {
        // Call a function to pull all modelConfigs from the database
        console.log("Request for all models received.");
        const configs = await(getAll());
        return new Response(JSON.stringify(configs), {
            headers: { 'Content-Type': 'application/json' },
          });
    }
}
    catch (e) { return new Response(JSON.stringify({ error: (e as any).message }), { status: 500 }); }
}
