import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AIzaSyArVR0EQDOfknogA7UQnmnlLGEVM8raPDE');
async function run() {
  const models = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-pro', 'gemini-1.5-flash'];
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const res = await model.generateContentStream('hello');
      for await (const chunk of res.stream) {}
      console.log(modelName, 'SUCCESS');
    } catch(err: any) {
      console.log(modelName, 'FAILED', err.message);
    }
  }
}
run();
