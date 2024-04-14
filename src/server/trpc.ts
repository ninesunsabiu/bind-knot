import { initTRPC } from '@trpc/server';
import { TRPCContext } from './context.js';

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const createCallerFactory = t.createCallerFactory;