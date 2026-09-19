import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { prompt } = await req.json();
  const apiKey = Deno.env.get('OPENAI_API_KEY');

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Chave da OpenAI não configurada.' }), { status: 500 });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  const resposta = data.choices[0]?.message?.content || 'Sem resposta.';

  return new Response(JSON.stringify({ resposta }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
