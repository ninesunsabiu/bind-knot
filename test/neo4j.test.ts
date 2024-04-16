import { expect, test, describe } from 'vitest'
import { trpcCaller } from './helper.js';

describe("a natural language interface to Cypher query language", () => {

    test("驱动正常可用连接数据", () => {
        return trpcCaller.graph.test().then((res) => {
            expect(res).toBeDefined()
        })
    })
})

