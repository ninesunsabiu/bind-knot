// import dotenv file
import 'dotenv/config';

import { createCallerFactory, appRouter } from '../src/server/index.js';
import { defaultZhiweiClient } from '../src/zhiwei/index.js';

export const trpcCaller = createCallerFactory(appRouter)(async () => {
    const zhiweiClient = await defaultZhiweiClient 

    return {
        zhiweiClient
    }
})
