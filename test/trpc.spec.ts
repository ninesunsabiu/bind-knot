import { describe, it, expect } from 'vitest';
import { trpcCaller } from './helper.js';

describe("basic test", () => {
    it("should call trpc api", () => {
        return trpcCaller.greeting().then(
            (res) => {
                expect(res).include("tRPC")
            }
        )
    })
})