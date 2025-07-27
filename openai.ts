import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For local development
});

export async function analyzeNote(noteText: string): Promise<{
  summary: string;
  suggestedCategory: string;
  keyTopics: string[];
  relevanceScore: number;
  insights: string[];
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system", 
        content: `You are an expert knowledge management AI assistant for a lawyer. Analyze notes and provide structured insights.
        
        Available categories: General, Meeting Notes, Case Notes, Articles, Ideas, Research, Templates, Reference
        
        Return your analysis as a JSON object with this exact structure:
        {
          "summary": "2-3 sentence summary of the note",
          "suggestedCategory": "one of the available categories",
          "keyTopics": ["topic1", "topic2", "topic3"],
          "relevanceScore": 85,
          "insights": ["insight 1", "insight 2"]
        }
        
        Guidelines:
        - summary: Concise 2-3 sentence summary
        - suggestedCategory: Choose the most appropriate category
        - keyTopics: 2-5 key topics/themes (no more than 5)
        - relevanceScore: 1-100 based on legal/professional importance
        - insights: 1-3 actionable insights or connections`
      }, {
        role: "user",
        content: `Analyze this note: "${noteText}"`
      }],
      temperature: 0.3,
      max_tokens: 400
    });
    
    const response = completion.choices[0].message.content?.trim();
    if (response) {
      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.warn('Failed to parse AI response:', parseError);
      }
    }
    
    // Fallback response
    return {
      summary: noteText.length > 100 ? noteText.substring(0, 100) + "..." : noteText,
      suggestedCategory: "General",
      keyTopics: [],
      relevanceScore: 50,
      insights: []
    };
    
  } catch (error) {
    console.warn('OpenAI API error:', error);
    return {
      summary: noteText.length > 100 ? noteText.substring(0, 100) + "..." : noteText,
      suggestedCategory: "General", 
      keyTopics: [],
      relevanceScore: 50,
      insights: []
    };
  }
}

export async function generateKnowledgeInsights(notes: any[]): Promise<{
  patterns: string[];
  recommendations: string[];
  crossReferences: Array<{ noteId1: string; noteId2: string; connection: string }>;
}> {
  try {
    // Get the most recent 20 notes for analysis
    const recentNotes = notes.slice(0, 20).map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      category: note.categoryId,
      tags: note.tags,
      linkedCases: note.linkedCaseIds,
      linkedPeople: note.linkedPersonIds
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `You are an expert knowledge management AI that identifies patterns and generates insights from a lawyer's notes.
        
        Analyze the notes and return a JSON object with this structure:
        {
          "patterns": ["pattern 1", "pattern 2"],
          "recommendations": ["recommendation 1", "recommendation 2"], 
          "crossReferences": [{"noteId1": "id1", "noteId2": "id2", "connection": "how they relate"}]
        }
        
        Focus on:
        - Recurring themes or topics
        - Knowledge gaps that need attention
        - Optimization opportunities
        - Cross-references between related notes
        - Actionable recommendations for better knowledge management`
      }, {
        role: "user",
        content: `Analyze these notes for patterns and insights: ${JSON.stringify(recentNotes)}`
      }],
      temperature: 0.4,
      max_tokens: 500
    });
    
    const response = completion.choices[0].message.content?.trim();
    if (response) {
      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.warn('Failed to parse AI insights response:', parseError);
      }
    }
    
    return {
      patterns: [],
      recommendations: [], 
      crossReferences: []
    };
    
  } catch (error) {
    console.warn('OpenAI API error for insights:', error);
    return {
      patterns: [],
      recommendations: [],
      crossReferences: []
    };
  }
}

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
