import { config } from 'dotenv';
config();

import { GenerationCommonConfigSchema, genkit, modelRef } from 'genkit';
import type { ModelInfo } from 'genkit/model';
import { openAI } from 'genkitx-openai';


const gpt41MiniInfo: ModelInfo = {
  versions: ['gpt-4.1-mini'],
  label: 'GPT-4.1 Mini (OpenRouter)',
  supports: {
    multiturn: true,
    tools: true,
    media: false,
    systemRole: true,
    output: ['json', 'text'],
  },
};

const gpt41MiniConfigSchema = GenerationCommonConfigSchema.extend({});


export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      models: [
        {

          name: 'openai/gpt-4.1-mini',
          info: gpt41MiniInfo,
          configSchema: gpt41MiniConfigSchema,
        },
      ],
    }),
  ],
});


export const llama3Model = modelRef({
  name: 'openai/openai/gpt-4.1-mini',
});