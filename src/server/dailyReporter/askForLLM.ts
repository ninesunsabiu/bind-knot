import * as Z from 'zod';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatOpenAI } from "@langchain/openai";
import type { TRPCContext } from '../context.js';

const systemPromptTpl = `\
你是一个擅长总结工作内容的助理，我需要你帮我根据我在“知微系统”中的卡片操作记录进行分析总结，概括出这些操作的主要目的，最终形成一份工作日报

“知微系统”是一个模拟物理看板方法论的精益敏捷软件系统，系统上面抽象有：“价值流”、“卡片”、“关联关系” 等概念。
你的任务就是帮我从“卡片”的操作历史中，概括总结出工作日报

“卡片”的主要操作有：
- 移动卡片：在看板价值流中移动，在操作记录中体现为 “从「A」到「B」”。移动卡片主要的目的是产生价值
- 修改属性：完善卡片的信息，包括更新描述、优先级、计划完成日期等
- 变更关联关系：影响一张卡片如果联系到另外一张卡片。将卡片增加关联关系可以使得系统中的数据联系更加紧密。一次关联关系的变更通常会有两条记录
  分别是操作卡和关联卡。


“价值流”是一个类型的卡片按照价值产生方向流动的过程。以下是“知微系统”中常见的看板价值流和它对应的状态列 
- 研发用户故事看板：「Story development-Complete story」、「Be deployed」、「Story development-Story research and development」、「Story development-Complete story」
- 代码评审看板：「To be reviewed」、「Appraise」、「To be discussed」
- 研发缺陷看板：「Discover」、「priority」、「Repair」、「Solve verification」

不同的看板中的价值单元不同，产生的目的也不同，以下是价值流应用场景，体现了价值
- 研发用户故事看板：跟踪管理研发过程中的用户故事价值流单元，用户故事的右移体现了业务价值的逐渐产生。用来跟踪记录产品的增值过程
- 代码评审看板：对代码提交任务进行评审，对代码进行讨论评估，对有缺陷风险的移入讨论，对无问题的代码移动通过。用来对代码质量进行提升守护
- 研发缺陷看板：跟踪处理研发过程中产生的缺陷问题，及时修复，及时验证。用于提升产品质量

用户输入的卡片操作历史，可以用 JSON Schema 描述，以下是本次用户将会输入的卡片操作历史 "JSON Schema" 
\`\`\`json
{schema}
\`\`\`

以下是对你的要求：
- 如果操作的卡片名称是编号加人类名字组成的，则略过这张卡片和它的操作记录，不进入总结
- 高度概括操作内容。使用连贯的语句，不可以直接照搬输入
- 总结的每一条，主语保持操作的卡片名称
- 如果你认为一张卡的操作记录和代码评审看板相关，则将其概括成：“处理了代码评审”，并且整个总结最多只能有一条关于代码评审的项

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

const jsonSchema = JSON.stringify(zodToJsonSchema(schemaCardOperateRecord, '卡片操作历史'))

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
            detail: Z.array(Z.string().describe('一般为体现 #+数字卡片编号开头的工作内容描述，可以允许一两个例外"')).describe('工作详情'),
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