import { expect, test, describe } from 'vitest';
import { trpcCaller } from './helper.js';
import { fillDate, prevWorkDay } from '~/server/dailyReporter/chinaHoliday.js';

describe('日报助手', () => {
    test('使用 zhiwei api 获取历史', { skip: true }, () => {
        return trpcCaller.dailyReporter.gen({ email: 'chenmy@agilean.cn' }).then((it) => {
            expect(it).toBeInstanceOf(Array);
        });
    });

    test('填充时间', () => {
        const days = fillDate('2024-01-01', '2024-01-01');
        expect(days.length).toBe(1);
    });

    test('monday', () => {
        return prevWorkDay(new Date(2024, 4, 3)).then((ret) => {
            expect(ret).toBeDefined();
        });
    });
});
