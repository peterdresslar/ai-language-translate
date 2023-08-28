declare global {
    namespace NodeJS {
      interface ProcessEnv {
        SUPABASE_URL: string;
        SUPABASE_PRIVATE_KEY: string;
        OPENAI_API_KEY: string;
      }
    }
  }

export {}