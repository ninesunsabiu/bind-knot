import { expect, test, describe } from 'vitest';
import { trpcCaller } from './helper.js';

describe('日报助手', () => {
    test('使用 zhiwei api 获取历史', () => {
        return trpcCaller.dailyReporter.gen({ email: 'chenmy@agilean.cn' }).then((it) => {
            expect(it).toBeInstanceOf(Array);
            expect(it.length).toBeGreaterThan(0)
        });
    });
});
