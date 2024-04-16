import { MemgraphGraph } from "@langchain/community/graphs/memgraph_graph";
import { publicProcedure, router } from "../trpc.js";


const graphProcedure = publicProcedure.use(async (opt) => {
    try {
        const graph = await MemgraphGraph.initialize({
            url: process.env.MEMGRAPH_URL,
            username: process.env.MEMGRAPH_USER,
            password: process.env.MEMGRAPH_PASSWORD,
            database: process.env.MEMGRAPH_DATABASE
        });
        return opt.next({ ctx: { graph } });
    } catch (error) {
        console.log(error);
        throw error;
    }
});


const queryInGraph = graphProcedure.query((opt) => {
    return opt.ctx.graph.query(
        `\
MATCH (n:Card:InProgress) WHERE n.vutId IN ['cbd6d7f626e448e7a28dff598584332b'] AND n.containerId IN ['b9f47a6d3b7446b298f60af3a36ae8a6']
WITH n
WHERE n.state = 'InProgress' AND (n.streamId = 'fca41bba-ce06-4000-8bad-a0a2daa82553' AND n.statusId IN ['aa5ab24ead39476591734039addf0397','f2f4815a2ee24da1898889c6ee08d590','9dbeffa6e0cb4b3682774c888e288226'])
WITH DISTINCT n as p
RETURN p.position AS position,p.name AS name,p.title AS title,p.statusId AS statusId,p.containerId AS containerId,p.vutId AS vutId,p.orgId AS orgId,p.id AS id,p.stepId AS stepId,p.created AS created,p.streamId AS streamId,p.codeInOrg AS codeInOrg,p.customCode AS customCode,p.state AS state,p.updated AS updated`
    );
});

export const graphRouter = router({
    test: queryInGraph
})