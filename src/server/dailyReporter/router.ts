import * as NEA from 'fp-ts/NonEmptyArray';
import * as A from 'fp-ts/Array';
import { flow } from 'fp-ts/function';
import * as Z from 'zod';
import { publicProcedure, router } from "../trpc.js";
import { getSomeoneOperateHistoryWithinYesterday } from './operateHistory.js';
import { type CardOperateRecord, askForLLM } from './askForLLM.js';


export const dailyReporterRouter = router({
    gen: publicProcedure
        .input(
            Z.object({
                email: Z.string().email()
            })
        )
        .query((opt) => {
            const {
                ctx: { zhiweiClient },
                input: { email: userIdentity }
            } = opt;

            const cardOperateHistory = getSomeoneOperateHistoryWithinYesterday(zhiweiClient, userIdentity);

            return cardOperateHistory
                .then(
                    A.match(
                        () => Promise.resolve([]),
                        flow(
                            NEA.groupBy(it => it.sourceName),
                            (groups) => {
                                const ret: CardOperateRecord = {}
                                for (const [key, value] of Object.entries(groups)) {
                                    ret[key] = value.map(it => it.content)
                                }
                                return ret
                            },
                            askForLLM
                        )
                    )
                )
        })
});
