import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './server/router.js';
import { ofClient } from './zhiwei/client.js';

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        return fetchRequestHandler({
            responseMeta: () => {
                return {
                    headers: {
                        'Access-Control-Allow-Origin': 'https://tkb.agilean.cn',
                        'Access-Control-Allow-Methods': 'GET,POST'
                    }
                };
            },
            endpoint: '/api',
            req: request,
            router: appRouter,
            createContext: async () => {
                return {
                    zhiweiClient: await ofClient({
                        orgIdentity: env.ZHIWEI_ORG_IDENTITY,
                        password: env.ZHIWEI_PASSWORD,
                        username: env.ZHIWEI_USERNAME,
                        baseUrl: env.ZHIWEI_BASE_URL
                    }),
                    env
                };
            }
        });
    }
};
