import { operateHistory } from '../zhiwei/index.js';
import { publicProcedure, router } from './trpc.js';

export const appRouter = router({
    greeting: publicProcedure.query(() => 'hello tRPC v11!'),
    zhiweiOptHis: publicProcedure.query((opts) => {
        return operateHistory(opts.ctx.zhiweiClient)('card')
    }),
    // add your logic router here
});

export type AppRouter = typeof appRouter;
