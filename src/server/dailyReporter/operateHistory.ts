import { pipe } from 'fp-ts/function';
import { isAfter, isBefore } from 'date-fns/fp';
import { type ZhiweiClient, operateHistory } from '~/zhiwei/index.js';
import { prevWorkRange } from './chinaHoliday.js';

export const getSomeoneOperateHistoryWithinYesterday = (client: ZhiweiClient, userIdentity: string) => {
    const api = operateHistory(client);

    // 搜索范围 从当天 4 点反推到前一天 0 点
    const searchRange = prevWorkRange(new Date());

    // `operateHistory` 是滚动加载分页的，目前没有针对人的过滤 所以只有连续调用

    const searchRec = (
        start: Date,
        acc: Awaited<ReturnType<ReturnType<typeof operateHistory>>>,
        curPage: number
    ): Promise<typeof acc> => {
        return api({ page: curPage, keyword: userIdentity }, 'card').then((res) => {
            const result = res.filter((it) => pipe(it.createdAt, isAfter(start)));
            if (result.length === 0) {
                return acc;
            } else {
                acc.push(...result);
                return searchRec(start, acc, curPage + 1);
            }
        });
    };

    return searchRange.then((s) => {
        const end = s.end;
        return searchRec(s.start, [], 0)
            .then((it) => it.filter((it) => pipe(it.createdAt, isBefore(end))))
            .then((it) => it.filter((it) => it.resource.memberName === userIdentity));
    });
};
