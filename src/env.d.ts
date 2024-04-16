declare namespace NodeJS {
    interface ProcessEnv {
        OPENAI_API_KEY: string;
        OPENAI_BASE_URL: string;
    }

    interface ProcessEnv {
        ZHIWEI_BASE_URL?: string;
        ZHIWEI_USERNAME: string;
        ZHIWEI_PASSWORD: string;
        ZHIWEI_ORG_IDENTITY: string;
    }

    interface ProcessEnv {
        
        MEMGRAPH_URL: string;
        MEMGRAPH_USER: string;
        MEMGRAPH_PASSWORD: string;
        MEMGRAPH_DATABASE?: string;
    }
}
