import * as Z from 'zod';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatOpenAI } from "@langchain/openai";
import type { TRPCContext } from '../context.js';

const systemPromptTpl = `\
你是一个擅长总结工作内容的助理，善于从工作记录中总结出工作内容。

工作记录，可以用 JSON Schema

"JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.

For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}}}
would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.

以下就是这次输入的工作项列表的 "JSON Schema" 
\`\`\`json
{schema}
\`\`\`

操作内容如果是：\`从「A」到「B」\`的话，代表了精益敏捷中卡片在价值流的移动，以下是几个常见的价值流的状态列
- 研发用户故事看板：「Story development-Complete story」、「Be deployed」、「Story development-Story research and development」、「Story development-Complete story」
- 代码评审看板：「To be reviewed」、「Appraise」、「To be discussed」
- 研发缺陷看板：「Discover」、「priority」、「Repair」、「Solve verification」

不同的看板中的价值单元不同，产生的目的也不同，以下是价值流应用场景，体现了价值
- 研发用户故事看板：跟踪管理研发过程中的用户故事价值流单元，用户故事的右移体现了业务价值的逐渐产生。用来跟踪记录产品的增值过程
- 代码评审看板：对代码提交任务进行评审，对代码进行讨论评估，对有缺陷风险的移入讨论，对无问题的代码移动通过。用来对代码质量进行提升守护
- 研发缺陷看板：跟踪处理研发过程中产生的缺陷问题，及时修复，及时验证。用于提升产品质量

以下是对你的要求：
- 操作的卡片名称 如果是编号加人类名字组成的，则忽略这条。例如: \`#988-欧阳\`
- 概括操作内容。使用连贯的语句，避免生搬硬套，推理分析操作背后的真实意图再输出，不可照搬输入
- 总结的每一条，主语保持操作的卡片名称，例如 "#\`96488\`-\`富文本在有表格的情况下无法全选删除内容\`: 移动至优先并且指定\`晓明\`去处理该缺陷" 反引号中的都是示例代词，具体总结时替换为真实内容

{format_instructions}
`;

const cardOperateHistoryPromptTpl = `\
这是我的输入:

\`\`\`json
{history}
\`\`\`
`;


const schemaCardOperateRecord = Z.object({
    cardName: Z.string().describe("操作的卡片名称，由卡片编号和卡片名称组成"),
    operations: Z.array(Z.string().describe("操作的内容")).describe("一张卡片所有的所有操作内容")
}).array()

export type CardOperateRecord = Z.infer<typeof schemaCardOperateRecord>;

const jsonSchema = JSON.stringify(zodToJsonSchema(schemaCardOperateRecord, '工作记录'))

export const askForLLM = (ctx: TRPCContext) => async (cardOperateHistory: CardOperateRecord) => {
    const { OPENAI_API_KEY, OPENAI_BASE_URL } = ctx.env;

    const model = new ChatOpenAI({
        temperature: 0.8,
        modelName: 'gpt-3.5-turbo-1106',
        openAIApiKey: OPENAI_API_KEY,
        configuration: { baseURL: OPENAI_BASE_URL }
    });

    const prompt = ChatPromptTemplate.fromMessages<Record<'schema' | 'history' | 'format_instructions', string>>([
        ['system', systemPromptTpl],
        ['human', cardOperateHistoryPromptTpl]
    ]);

    const outputParser = StructuredOutputParser.fromZodSchema(
        Z.object({
            detail: Z.array(Z.string().describe('一般为体现 #+数字卡片编号开头的工作内容描述，例如 "#94409-前端配置项迁移: 完成了桌面检查并移交了测试"')).describe('工作详情'),
            summary: Z.string().describe('工作总结 一句简单的话对工作详情的总体概括，不要出现太多主观的夸奖')
        })
    );

    const chain = prompt.pipe(model).pipe(outputParser);

    return await chain.invoke({
        schema: jsonSchema,
        history: JSON.stringify(cardOperateHistory),
        format_instructions: outputParser.getFormatInstructions()
    });
};