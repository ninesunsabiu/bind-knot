import * as A from 'fp-ts/Array';
import * as Z from 'zod';
import {
    getYear,
    parse,
    subDays,
    differenceInCalendarDays,
    addDays,
    startOfDay,
    isWeekend,
    getUnixTime
} from 'date-fns/fp';
import { flow, pipe } from "fp-ts/function";
import wretch from 'wretch';


const url = 'https://www.shuyz.com/githubfiles/china-holiday-calender/master/holidayAPI.json';

const schemaHoliday = Z.object({
    Years: Z.record(Z.array(Z.object({ StartDate: Z.string(), EndDate: Z.string(), CompDays: Z.array(Z.string()) })))
});

const parseFromHolidayApi = parse(new Date(), 'yyyy-MM-dd');

export const fillDate = (start: string, end: string) => {
    const startDate = pipe(start, parseFromHolidayApi, startOfDay);
    const endDate = parseFromHolidayApi(end);

    // 从 startDate 开始 按天 生成日期到 endDate
    const diff = differenceInCalendarDays(startDate, endDate) + 1;

    return Array.from({ length: diff }, (_, idx) => {
        return pipe(startDate, addDays(idx), getUnixTime);
    });
};

/**
 * 获得当前日期的前一个工作日时间
 */
export const prevWorkDay = async (curDate: Date) => {
    const prevDay = pipe(curDate, subDays(1), startOfDay);

    return wretch(url)
        .get()
        .json()
        .then((res) => {
            // 以 前一天 所在的年份获取节假日表
            return schemaHoliday.parse(res).Years[getYear(prevDay)] ?? [];
        })
        .then((holiday) => {
            // 节假日填充到日历中
            const holidayMap = new Set(holiday.flatMap((it) => fillDate(it.StartDate, it.EndDate)));
            // 调休日期填充到日历中
            const compDayMap = new Set(
                holiday.flatMap((it) => pipe(it.CompDays, A.map(flow(parseFromHolidayApi, startOfDay, getUnixTime))))
            );
            return { holidayMap, compDayMap };
        })
        .then(({ holidayMap, compDayMap }) => {
            // 指针日期
            let cur = prevDay;

            let guard = 1;

            while (true) {
                if (guard > 30) {
                    // 现实生活中 没有那么长的假期
                    throw new Error('找不到上一个工作日');
                }

                const ts = getUnixTime(cur);
                // 调休日 或者 非周末的非假期
                if (compDayMap.has(ts) || (!isWeekend(cur) && !holidayMap.has(ts))) {
                    return cur;
                } else {
                    cur = pipe(cur, subDays(1));
                    guard++;
                    continue;
                }
            }
        });
}