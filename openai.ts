import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For local development
});

export async function estimateTaskTime(task: {
  title: string;
  type: string;
  priority: string;
  case?: string;
}): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "You are a legal task time estimator. Estimate time for legal tasks. Return ONLY a time like '30 min', '2 hours', '4 hours'. Be realistic."
      }, {
        role: "user",
        content: `Estimate time for: ${task.title} (Type: ${task.type}, Priority: ${task.priority}${task.case ? `, Case: ${task.case}` : ''})`
      }],
      temperature: 0.3,
      max_tokens: 10
    });
    
    return completion.choices[0].message.content || "2 hours";
  } catch (error) {
    return "2 hours"; // Fallback
  }
}
