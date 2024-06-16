import { expect, it, describe, vi } from 'vitest';

describe('将单一的任务列表合并成一个对外的请求', () => {
    // 假设有下面一个场景，有一个 ID 字符串组成的列表 每个 ID 对应一个实体信息
    // 现在需要将这个 ID 列表 映射成 实体信息列表
    // 已有的外部系统信息能力：getInfoByIdBatch: (idList: Array<string>) => Promise<Array<Info>>
    // 但是我想要在调用时可以 Promise.all(ids.map(getInfoById)) 这样像单个处理一样
    // 有一个自动把这个期间单个 ID 的调用 合并到一起的能力

    type Identifier = string;

    type Configuration<Input, Output> = {
        /**
         * 最终的处理逻辑 需要用户指定
         */
        executor: (input: Array<Input>) => Promise<Array<Output>>;
        /**
         * 输入与输出的查找关系
         */
        identifier: {
            input: (i: Input) => Identifier;
            output: (o: Output) => Identifier;
        };
    };

    type Executor<Input, Output> = (input: Input) => Promise<Output>;

    type GetCollectionBatchExecutor = <Input, Output>(
        configuration: Configuration<Input, Output>
    ) => <Ret>(fn: (executor: Executor<Input, Output>) => Promise<Ret>) => Promise<Ret>;

    it('单体映射函数像普通的函数一样异步使用', () => {
        const conf: Configuration<string, { id: string; name: string }> = {
            identifier: { input: (i) => i, output: (entity) => entity.id },
            // 真正的 批量接口发生器
            executor: vi.fn((input) => Promise.resolve(input.map((i) => ({ id: i, name: `name:${i}` }))))
        };

        const batchContext = getCollectionBatchExecutor(conf);

        return batchContext(async (getById) => {
            let str = ''
            // 像单条一样写请求
            for await (const info of Array.from({ length: 10 }, (_, k) => getById(`${k}`))) {
                str += `${info.name};`
            }
            return str;
        })
        .then((ret) => {
            expect(typeof ret).eq("string");
            // 最终执行器只调用一次
            expect(conf.executor).toHaveBeenCalledOnce();
        });
    });

    // implement here

    const getCollectionBatchExecutor: GetCollectionBatchExecutor = (configuration) => {
        const {
            executor,
            identifier: { input: idForInput, output: idForOutput }
        } = configuration;

        type I = Parameters<typeof idForInput>[0];
        type O = Parameters<typeof idForOutput>[0];

        // 任务记录
        const queue: Map<Identifier, { i: I; resolve: (v: O) => void; reject: (v: any) => void }> = new Map();

        const singleTask = (i: Parameters<typeof idForInput>[0]): Promise<Parameters<typeof idForOutput>[0]> => {
            return new Promise((resolve, reject) => {
                queue.set(idForInput(i), { i, resolve, reject });
            });
        };

        return async (fn) => {
            // 同步代码块 开始收集
            const ret = fn(singleTask);
            // 结束收集任务

            // 开始执行最终请求
            try {
                const outList = await executor(Array.from(queue.values()).map((it) => it.i));
                outList.forEach((out) => {
                    const id = idForOutput(out);
                    const task = queue.get(id);
                    if (task !== undefined) {
                        task.resolve(out);
                        // 删除标记
                        queue.delete(id);
                    } else {
                        throw new Error('任务无法匹配');
                    }
                });

                if (queue.size !== 0) {
                    throw new Error('批量任务数不匹配');
                }
            } catch (reason) {
                queue.forEach(({ reject }) => reject(reason));
            }

            // 将执行区的结果返回给调用者
            return ret;
        };
    };
});
