import { ZhiweiClient } from "../client.js";

export const operateHistory = (client: ZhiweiClient) => {
    return (scope: 'card') => {
        return client.fetcher 
            .post({ orgId: client.orgId, scope, page: 0, size: 60, keyWord: '' }, '/api/v1/opt-his/query')
            .json();
    }
}