type OpenRouterMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

interface GeminiCompletionOptions {
  model?: string;
  messages: OpenRouterMessage[];
  maxTokens?: number;
  temperature?: number;
}


export async function geminiFlashCompletion({
  messages,
  maxTokens = 4096,
  temperature = 0.7,
  model = 'google/gemini-1.5-flash',
}: GeminiCompletionOptions) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',

      // REQUIRED by OpenRouter
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL!, // change to your domain in prod
      'X-Title': 'Corocat',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter Gemini error: ${res.status} ${err}`);
  }

  const data = await res.json();

  return data.choices[0].message.content as string;
}