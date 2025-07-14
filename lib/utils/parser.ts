import { format, addDays, parse } from 'date-fns';

export interface ParsedTask {
  title: string;
  type: 'task' | 'call' | 'meeting' | 'deposition' | 'hearing';
  priority: 'DEADLINE' | 'P1' | 'P2' | 'QUICK' | 'SOMEDAY';
  doDate: string;
  deadline?: string;
  duration?: string;
  caseName?: string;  // We'll match this to case ID later
  personName?: string; // We'll match this to person ID later
}

export function parseNaturalLanguage(
  input: string,
  cases: Array<{ id: string; name: string; client: string }> = [],
  people: Array<{ id: string; name: string; role: string }> = []
): ParsedTask & { caseId?: string; personId?: string } {
  let parsed: ParsedTask = {
    title: input,
    type: 'task',
    priority: 'P2',
    doDate: 'Today',
  };

  let caseId: string | undefined;
  let personId: string | undefined;

  // Extract @person
  const personMatch = input.match(/@(\w+)/);
  if (personMatch) {
    const searchTerm = personMatch[1].toLowerCase();
    const person = people.find(p => 
      p.name.toLowerCase().includes(searchTerm)
    );
    
    if (person) {
      parsed.personName = person.name;
      personId = person.id;
      parsed.title = parsed.title.replace(/@\w+/, person.name);
    }
  }

  // Extract #case
  const caseMatch = input.match(/#(\w+)/);
  if (caseMatch) {
    const searchTerm = caseMatch[1].toLowerCase();
    const foundCase = cases.find(c => 
      c.name.toLowerCase().includes(searchTerm) ||
      c.client.toLowerCase().includes(searchTerm)
    );
    
    if (foundCase) {
      parsed.caseName = foundCase.name;
      caseId = foundCase.id;
      parsed.title = parsed.title.replace(/#\w+/, '').trim();
    }
  }

  // Extract priority
  const priorityMatch = input.match(/!(quick|p1|p2|deadline|someday)/i);
  if (priorityMatch) {
    const priority = priorityMatch[1].toUpperCase();
    if (priority === 'QUICK') {
      parsed.priority = 'QUICK';
    } else if (priority === 'P1') {
      parsed.priority = 'P1';
    } else if (priority === 'P2') {
      parsed.priority = 'P2';
    } else if (priority === 'DEADLINE') {
      parsed.priority = 'DEADLINE';
    } else if (priority === 'SOMEDAY') {
      parsed.priority = 'SOMEDAY';
    }
    parsed.title = parsed.title.replace(/!\w+/, '').trim();
  }

  // Detect task type based on keywords
  const titleLower = parsed.title.toLowerCase();
  if (titleLower.includes('call')) {
    parsed.type = 'call';
    parsed.duration = '30 min';
  } else if (titleLower.includes('meeting')) {
    parsed.type = 'meeting';
    parsed.duration = '1 hour';
  } else if (titleLower.includes('depo')) {
    parsed.type = 'deposition';
    parsed.duration = '3 hours';
  } else if (titleLower.includes('hearing')) {
    parsed.type = 'hearing';
    parsed.duration = '2 hours';
  }

  // Parse dates and times
  const today = new Date();
  
  if (input.includes('tomorrow')) {
    parsed.doDate = format(addDays(today, 1), 'MMM d');
  } else if (input.includes('today')) {
    parsed.doDate = 'Today';
  } else if (input.includes('monday')) {
    // Find next Monday
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
    parsed.doDate = format(nextMonday, 'MMM d');
  } else if (input.includes('friday')) {
    // Find next Friday
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + (5 + 7 - today.getDay()) % 7);
    parsed.doDate = format(nextFriday, 'MMM d');
  }

  // Extract time
  const timeMatch = input.match(/at (\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (timeMatch) {
    const [, hour, minutes = '00', ampm] = timeMatch;
    parsed.doDate += ` ${hour}:${minutes} ${ampm.toUpperCase()}`;
    parsed.title = parsed.title.replace(/at \d{1,2}(?::\d{2})?\s*(?:am|pm)/i, '').trim();
  }

  // Handle deadlines
  const deadlineMatch = input.match(/deadline\s+(\w+\s+\d+|\w+)/i);
  if (deadlineMatch) {
    parsed.deadline = deadlineMatch[1];
    parsed.priority = 'DEADLINE';
    // Set do date 2 days before deadline if possible
    try {
      const deadlineDate = new Date(deadlineMatch[1]);
      if (!isNaN(deadlineDate.getTime())) {
        parsed.doDate = format(addDays(deadlineDate, -2), 'MMM d');
      }
    } catch (e) {
      // Keep original doDate if parsing fails
    }
    parsed.title = parsed.title.replace(/deadline\s+\w+\s*\d*/i, '').trim();
  }

  // Clean up title
  parsed.title = parsed.title.replace(/\s+/g, ' ').trim();

  return { ...parsed, caseId, personId };
}
