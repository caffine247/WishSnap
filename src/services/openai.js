const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export async function identifyItemFromPhoto(base64Image) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'This is a photo of a child holding or pointing at an item they want as a gift. Identify the item as specifically as possible. Return a JSON object with: { "name": "product name", "category": "toy/game/book/etc", "searchQuery": "best search query to find this on a shopping site", "confidence": "high/medium/low" }. Return only the JSON, no other text.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
      max_tokens: 300,
    }),
  });

  const data = await response.json();
  console.log('OpenAI response:', JSON.stringify(data));
  if (data.error) throw new Error(data.error.message);
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in response');
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
