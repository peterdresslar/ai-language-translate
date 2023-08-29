declare global {
    namespace NodeJS {
      interface ProcessEnv {
        NEXT_PUBLIC_SUPABASE_URL: string;
        NEXT_PUBLIC_SUPABASE_PRIVATE_KEY: string;
        OPENAI_API_KEY: string;
      }
    }
  }

export {}