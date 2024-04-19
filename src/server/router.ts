import { dailyReporterRouter } from './dailyReporter/router.js';
import { graphRouter } from './graphRelationship/index.js';
import { publicProcedure, router } from './trpc.js';

export const appRouter = router({
    greeting: publicProcedure.query(() => 'hello tRPC v11!'),
    // add your logic router here
    dailyReporter: dailyReporterRouter,
    graph: graphRouter
});

export type AppRouter = typeof appRouter;
