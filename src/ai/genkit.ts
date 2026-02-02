import { config } from 'dotenv';
config();

import { genkit, modelRef } from 'genkit';
import { openAI } from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      models: [
        {
          name: 'meta-llama/llama-3.3-70b-instruct:free',
          info: {
            label: 'Llama 3.3 70B (OpenRouter)',
            supports: {
              multiturn: true,
              systemRole: true,
            },
          },
        },
      ],
    }),
  ],
});

export const llama3Model = modelRef({
  name: 'openai/meta-llama/llama-3.3-70b-instruct:free',
});