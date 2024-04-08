// import dotenv file
import 'dotenv/config';

import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const model = new ChatOpenAI({
    temperature: 0.9
});

const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a world class technical documentation writer.'],
    ['user', '{input}']
]);

const chain = prompt.pipe(model);

const res = await chain.invoke({
    input: "what is Agilean?"
});

console.log(res);
