import { expect, test, describe } from 'vitest'
import { trpcCaller } from './helper.js';

describe("a natural language interface to Cypher query language", () => {

    test("驱动正常可用连接数据", () => {
        return trpcCaller.graph.test().then((res) => {
            expect(res).toBeDefined()
        })
    })

    test("针对 graph database 询问", () => {
        return trpcCaller.graph.ask({ message: "'v4.8.0' 的缺陷卡有哪些" }).then((res) => {
            expect(res).toBeDefined()
        })
    })
})

