import * as Id from 'fp-ts/Identity';
import { pipe } from 'fp-ts/function';
import { subDays, setHours, isWithinInterval } from 'date-fns/fp';
import { ZhiweiClient, operateHistory } from '../../zhiwei/index.js'

export const getSomeoneOperateHistoryWithinYesterday = (client: ZhiweiClient, userIdentity: string) => {
    const api = operateHistory(client);
    // `operateHistory` 是滚动加载分页的，目前没有针对人的过滤 所以只有连续调用 

    const searchRange = pipe(new Date(), Id.bindTo("end"), Id.bind("start", ({ end }) => pipe(end, subDays(1))));

    const searchRec = (acc: Awaited<ReturnType<ReturnType<typeof operateHistory>>>, curPage: number): Promise<typeof acc> => {
        return api(curPage, 'card').then((res) => {
            const result = res.filter((it) => pipe(new Date(it.createdAt), isWithinInterval(searchRange)));
            if (result.length === 0) {
                return acc;
            } else {
                acc.push(...result);
                return searchRec(acc, curPage + 1);
            }
        });
    }

    return searchRec([], 0).then(it => it.filter(it => it.resource.memberName === userIdentity));
}