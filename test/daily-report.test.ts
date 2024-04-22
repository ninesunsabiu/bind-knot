import { expect, test, describe } from 'vitest';
import { trpcCaller } from './helper.js';
import { fillDate, prevWorkRange } from '~/server/dailyReporter/chinaHoliday.js';

describe('日报助手', () => {
    test('使用 zhiwei api 获取历史', () => {
        return trpcCaller.dailyReporter.gen({ email: 'linjx@agilean.cn' }).then((it) => {
            console.log(it)
            expect(it).toBeInstanceOf(Array);
        });
    });

    test('填充时间', () => {
        const days = fillDate('2024-01-01', '2024-01-01');
        expect(days.length).toBe(1);
    });

    test('获得当前日期的到前一个工作日的日期范围', () => {
        return prevWorkRange(new Date(2024, 3, 22)).then((ret) => {
            expect(ret.start).toBeDefined();
            expect(ret.end).toBeDefined();
        });
    });
});
