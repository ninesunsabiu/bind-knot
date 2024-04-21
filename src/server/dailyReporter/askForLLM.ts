import * as Z from 'zod';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatOpenAI } from "@langchain/openai";

const systemPromptTpl = `\
你是一个擅长总结工作内容的助理，善于从工作记录中总结出前一个工作日的工作内容。
工作记录列表是一个 JSON 数组格式的数据，这个数组中的每个项成为\`工作记录\`，用 JSONSchema 描述。
JSONSchema:
\`\`\`
{schema}
\`\`\`

操作内容如果是：\`从「A」到「B」\`的话，代表了精益敏捷中卡片在价值流的移动，以下是几个常见的移动场景用 \`内容 -> 含义\` 来表示
- 从「Story development-Complete story」移动到「Be deployed」-> 故事完成开始进入测试
- 从「acceptance-testing」移动到「acceptance-Acceptance」 -> 故事测试完成等待验收
- 从「Solve verification」移动到「TKB verification」-> 缺陷验证完成

以下是对你的要求：
- 需要尊重\`工作记录\`的事实基础，做到每个概括都能从\`工作记录\`中找到依据。
- 需要以第一人称的角度思考，把你当成主人翁，但是要是总结中不要出现 "我" 这类人称代词，也不要出现 "可能"，"也许" 这类词语。
- 如果操作的卡片名称符合 "#数字-人名" 的话，请忽略整条内容。
- 尝试推测出这些内容背后的行为目的，不用出现原始的操作的内容。记住，如果推测不出来就不要推测。
- 如果\`工作记录\`的操作卡名称是一个人名的话，省略掉它。
- 可用适当合并一下可能相关的卡片到同一个列表项中，例如，都是在处理同一类任务

{format_instructions}
`;

const cardOperateHistoryPromptTpl = `\
这是我的工作记录:
\`\`\`json
{history}
\`\`\`
`;


const schemaCardOperateRecord = Z.record(
    Z.string().describe("操作的卡片名称"),
    Z.array(Z.string().describe("操作的内容")).describe("一张卡片所有的所有操作内容")
).describe("工作记录");


export type CardOperateRecord = Z.infer<typeof schemaCardOperateRecord>;

const jsonSchema = JSON.stringify(zodToJsonSchema(schemaCardOperateRecord, '工作记录'))

export const askForLLM = async (cardOperateHistory: CardOperateRecord) => {
    const model = new ChatOpenAI({ temperature: 0.3, modelName: 'gpt-3.5-turbo-0125' });

    const prompt = ChatPromptTemplate.fromMessages<Record<'schema' | 'history' | 'format_instructions', string>>([
        ['system', systemPromptTpl],
        ['human', cardOperateHistoryPromptTpl]
    ]);

    const outputParser = StructuredOutputParser.fromZodSchema(
        Z.array(Z.string().describe('工作内容')).describe('工作项列表')
    );

    const chain = prompt.pipe(model).pipe(outputParser);

    return await chain.invoke({
        schema: jsonSchema,
        history: JSON.stringify(cardOperateHistory),
        format_instructions: outputParser.getFormatInstructions()
    });
};