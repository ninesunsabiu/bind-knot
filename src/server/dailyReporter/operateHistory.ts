import { pipe } from 'fp-ts/function';
import { isWithinInterval } from 'date-fns/fp';
import { ZhiweiClient, operateHistory } from '~/zhiwei/index.js';
import { prevWorkRange } from './chinaHoliday.js';

export const getSomeoneOperateHistoryWithinYesterday = (client: ZhiweiClient, userIdentity: string) => {
    const api = operateHistory(client);

    // 搜索范围 从当天 4 点反推到前一天 0 点
    const searchRange = prevWorkRange(new Date())

    // `operateHistory` 是滚动加载分页的，目前没有针对人的过滤 所以只有连续调用

    const searchRec = (
        searchRange: { start: Date, end: Date },
        acc: Awaited<ReturnType<ReturnType<typeof operateHistory>>>,
        curPage: number
    ): Promise<typeof acc> => {
        return api({ page: curPage, keyword: userIdentity }, 'card').then((res) => {
            const result = res.filter((it) => pipe(new Date(it.createdAt), isWithinInterval(searchRange)));
            if (result.length === 0) {
                return acc;
            } else {
                acc.push(...result);
                return searchRec(searchRange, acc, curPage + 1);
            }
        });
    };

    return searchRange.then((s) =>
        searchRec(s, [], 0).then((it) => it.filter((it) => it.resource.memberName === userIdentity))
    );
};
