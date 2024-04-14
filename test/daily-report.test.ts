import { expect, test, describe } from 'vitest'
import { trpcCaller } from './helper.js';

describe("日报助手", () => {

    test("使用 zhiwei api 获取历史", () => {

        return trpcCaller.zhiweiOptHis().then(
            (res) => {
                expect(res).toBeDefined()
            }
        )
    })
})

