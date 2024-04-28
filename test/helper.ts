// import dotenv file
import 'dotenv/config';

import { createCallerFactory, appRouter } from '../src/server/index.js';
import { ofClient } from '../src/zhiwei/index.js';

export const trpcCaller = createCallerFactory(appRouter)(async () => {
    const env = process.env;
    const zhiweiClient = await ofClient({
        orgIdentity: env.ZHIWEI_ORG_IDENTITY,
        password: env.ZHIWEI_PASSWORD,
        username: env.ZHIWEI_USERNAME,
        baseUrl: env.ZHIWEI_BASE_URL
    }) 

    return { zhiweiClient, env }
})
