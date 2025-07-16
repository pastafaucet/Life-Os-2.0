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
        content: `You are an expert legal task time estimator with deep knowledge of legal workflows. 
        
        Analyze the task and provide a realistic time estimate based on:
        - Task complexity and type
        - Priority level (DEADLINE = urgent/complex, P1 = high priority, P2 = normal, QUICK = simple tasks)
        - Task type specifics (calls = 15-30 min, meetings = 30-60 min, research = 1-4 hours, drafting = 2-8 hours)
        
        Return ONLY the time estimate in format like: "15 min", "1 hour", "3 hours", "45 min"
        
        Common estimates:
        - Quick calls: 15-30 min
        - Client meetings: 30-60 min  
        - Document review: 1-3 hours
        - Research tasks: 2-4 hours
        - Brief writing: 4-8 hours
        - Depositions: 2-6 hours
        - Court hearings: 1-4 hours
        
        Be specific and realistic. Avoid generic "2 hours" estimates.`
      }, {
        role: "user",
        content: `Estimate time for: "${task.title}" 
        
        Task Details:
        - Type: ${task.type}
        - Priority: ${task.priority}
        ${task.case ? `- Case: ${task.case}` : ''}
        
        Provide a specific time estimate:`
      }],
      temperature: 0.2,
      max_tokens: 20
    });
    
    const estimate = completion.choices[0].message.content?.trim();
    
    // Validate the response format and provide intelligent fallbacks
    if (estimate && /^\d+\s*(min|minutes?|hour?s?|hr?s?)$/i.test(estimate)) {
      return estimate;
    }
    
    // Intelligent fallback based on task type and priority
    return getIntelligentFallback(task);
    
  } catch (error) {
    console.warn('OpenAI API error:', error);
    return getIntelligentFallback(task);
  }
}

function getIntelligentFallback(task: {
  title: string;
  type: string;
  priority: string;
  case?: string;
}): string {
  const title = task.title.toLowerCase();
  const type = task.type.toLowerCase();
  const priority = task.priority;
  
  // Analyze task type
  if (type === 'call') {
    if (title.includes('brief') || title.includes('complex')) return '45 min';
    if (title.includes('quick') || title.includes('check')) return '15 min';
    return '30 min';
  }
  
  if (type === 'meeting') {
    if (title.includes('deposition') || title.includes('hearing')) return '3 hours';
    if (title.includes('brief') || title.includes('strategy')) return '90 min';
    return '1 hour';
  }
  
  if (type === 'deposition') {
    if (title.includes('expert') || title.includes('key')) return '4 hours';
    return '3 hours';
  }
  
  if (type === 'hearing') {
    if (title.includes('trial') || title.includes('motion')) return '2 hours';
    return '1 hour';
  }
  
  // Analyze content keywords
  if (title.includes('review') || title.includes('read')) {
    if (title.includes('contract') || title.includes('agreement')) return '90 min';
    return '1 hour';
  }
  
  if (title.includes('draft') || title.includes('write')) {
    if (title.includes('motion') || title.includes('brief')) return '4 hours';
    if (title.includes('letter') || title.includes('email')) return '30 min';
    return '2 hours';
  }
  
  if (title.includes('research')) {
    if (title.includes('case law') || title.includes('statute')) return '3 hours';
    return '90 min';
  }
  
  // Priority-based fallbacks
  if (priority === 'DEADLINE') return '3 hours';
  if (priority === 'P1') return '2 hours';
  if (priority === 'QUICK') return '30 min';
  if (priority === 'PERSONAL') return '1 hour';
  
  // Final fallback
  return '90 min';
}
