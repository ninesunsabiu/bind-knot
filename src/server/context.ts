import type { ZhiweiClient } from "../zhiwei/client.js";

export type TRPCContext = {
    zhiweiClient: ZhiweiClient;
}