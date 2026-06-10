const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export async function identifyItemFromPhoto(base64Image) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Identify the gift item in this photo. Return only JSON: { "name": "product name", "category": "toy/game/book/etc", "searchQuery": "shopping search query", "confidence": "high/medium/low" }',
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 150,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in response');
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
