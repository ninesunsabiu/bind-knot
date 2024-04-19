import * as Z from 'zod';
import { ZhiweiClient } from '../client.js';

export const operateHistory = (client: ZhiweiClient) => {
    return (page: number, scope: 'card') => {
        return client.fetcher
            .post({ orgId: client.orgId, scope, page, size: 60, keyWord: '' }, '/api/v1/opt-his/query')
            .json()
            .then((it) => {
                return Z.object({
                    resultValue: Z.object({
                        content: Z.string().describe('操作内容'),
                        createdAt: Z.string().describe('记录产生时间戳 ISO 格式'),
                        resource: Z.object({
                            memberName: Z.string().describe('用户邮箱 唯一标志'),
                            nickName: Z.string().describe('用户昵称')
                        }),
                        sourceId: Z.string().describe('操作卡的 ID'),
                        sourceName: Z.string().describe('操作卡号')
                    }).array()
                }).parse(it).resultValue;
            });
    };
};
