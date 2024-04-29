import * as Z from 'zod';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatOpenAI } from "@langchain/openai";
import type { TRPCContext } from '../context.js';

const systemPromptTpl = `\
你是一个擅长总结工作内容的助理，善于从工作记录中总结出前一个工作日的工作内容。
工作记录列表是一个 JSON 数组格式的数据，这个数组中的每个项成为\`工作记录\`，用 JSONSchema 描述。
JSONSchema:
\`\`\`
{schema}
\`\`\`

操作内容如果是：\`从「A」到「B」\`的话，代表了精益敏捷中卡片在价值流的移动，以下是几个常见的 「A」和 「B」所属的价值流
- 研发用户故事看板：「Story development-Complete story」、「Be deployed」、「Story development-Story research and development」、「Story development-Complete story」
- 代码评审看板：「To be reviewed」、「Appraise」、「To be discussed」
- 研发缺陷看板：「Discover」、「priority」、「Repair」、「Solve verification」

以下是价值流看板的应用场景：
- 研发用户故事看板：跟踪管理研发过程中的用户故事价值流单元，用户故事的右移体现了业务价值的逐渐产生。用来跟踪记录产品的增值过程
- 代码评审看板：对代码提交任务进行评审，对代码进行讨论评估，对有缺陷风险的移入讨论，对无问题的代码移动通过。用来对代码质量进行提升守护
- 研发缺陷看板：跟踪处理研发过程中产生的缺陷问题，及时修复，及时验证。用于提升产品质量

以下是对你的要求：
- 将 从「A」到「B」这类的价值单元移动卡片，概括背后的含义，不要出现 从「A」到「B」
- 将所有的代码评审相关的\`工作记录\`概括成：处理了代码评审任务
- 只合并所有的：“处理了代码评审任务” 成一条

{format_instructions}
`;

const cardOperateHistoryPromptTpl = `\
这是我的工作记录:
\`\`\`json
{history}
\`\`\`
`;


const schemaCardOperateRecord = Z.record(
    Z.string().describe("操作的卡片名称，由卡片编号和卡片名称组成"),
    Z.array(Z.string().describe("操作的内容")).describe("一张卡片所有的所有操作内容")
).describe("工作记录");


export type CardOperateRecord = Z.infer<typeof schemaCardOperateRecord>;

const jsonSchema = JSON.stringify(zodToJsonSchema(schemaCardOperateRecord, '工作记录'))

export const askForLLM = (ctx: TRPCContext) => async (cardOperateHistory: CardOperateRecord) => {
    const { OPENAI_API_KEY, OPENAI_BASE_URL } = ctx.env;
    const model = new ChatOpenAI({ temperature: 0.8, modelName: 'gpt-3.5-turbo-1106', configuration: { apiKey: OPENAI_API_KEY, baseURL: OPENAI_BASE_URL } });

    const prompt = ChatPromptTemplate.fromMessages<Record<'schema' | 'history' | 'format_instructions', string>>([
        ['system', systemPromptTpl],
        ['human', cardOperateHistoryPromptTpl]
    ]);

    const outputParser = StructuredOutputParser.fromZodSchema(
        Z.array(Z.string().describe('一般为体现 #+数字卡片编号开头的工作内容描述，例如 "#94409-前端配置项迁移: 完成了桌面检查并移交了测试"')).describe('工作项列表')
    );

    const chain = prompt.pipe(model).pipe(outputParser);

    return await chain.invoke({
        schema: jsonSchema,
        history: JSON.stringify(cardOperateHistory),
        format_instructions: outputParser.getFormatInstructions()
    });
};