import * as Z from 'zod';
import { Tool } from 'langchain/tools';
import { ChatOpenAI } from "@langchain/openai";
import { MemgraphGraph } from "@langchain/community/graphs/memgraph_graph";
import { GraphCypherQAChain } from "langchain/chains/graph_qa/cypher";
import { publicProcedure, router } from "../trpc.js";
import { getSomeoneOperateHistoryWithinYesterday } from './operateHistory.js';


export const dailyReporterRouter = router({
    gen: publicProcedure.input(Z.object({
        email: Z.string().email()
    })).query(
        (opt) => {
            const {
                ctx: { zhiweiClient },
                input: { email: userIdentity }
            } = opt;

            return getSomeoneOperateHistoryWithinYesterday(zhiweiClient, userIdentity)
        }
    )
})
