// Core data types for Life OS task management system

export interface Task {
  id: string;
  title: string;
  type: 'task' | 'call' | 'meeting' | 'deposition' | 'hearing';
  priority: 'DEADLINE' | 'P1' | 'P2' | 'QUICK' | 'SOMEDAY';
  doDate: string;
  deadline?: string;
  duration?: string;
  caseId?: string;
  personId?: string;
  notes?: string;
  timeEstimate?: string;
  attendees?: string[];
  location?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  id: string;
  name: string;
  client: string;
  value: string;
  status: 'Active' | 'Discovery' | 'Settlement' | 'Trial Prep' | 'Closed';
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
}

// Knowledge Management Types

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string; // AI-generated summary
  
  // Linking System
  categoryId: string; // Required - every note must have a category
  linkedTopicIds: string[]; // NEW: Thematic content groupings
  linkedCaseIds: string[]; // Strong case linking
  linkedTaskIds: string[]; // Optional task linking
  linkedPersonIds: string[]; // Person references
  linkedNoteIds: string[]; // Cross-note references
  
  tags: string[]; // Secondary organization
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  noteCount: number; // Live count for UI
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  name: string;           // "Contract Law", "Estate Planning"
  description?: string;
  color: string;          // Orange theme
  noteCount: number;      // Live count for UI
  createdAt: string;
  updatedAt: string;
}

export interface NoteLink {
  id: string;
  sourceNoteId: string;
  targetId: string;
  targetType: 'note' | 'task' | 'case' | 'person';
  linkType: 'reference' | 'related' | 'dependency' | 'follows';
  createdAt: string;
}

export interface ParsedNote {
  title: string;
  content: string;
  categoryId?: string;
  topicName?: string;
  caseName?: string;
  personName?: string;
  tags: string[];
}

export interface AppData {
  tasks: Task[];
  cases: Case[];
  people: Person[];
  notes: Note[];
  categories: Category[];
  topics: Topic[];
  noteLinks: NoteLink[];
  version: string;
  lastSync: string;
}

export interface ParsedTask {
  title: string;
  type: Task['type'];
  priority: Task['priority'];
  doDate: string;
  deadline?: string;
  duration?: string;
  caseName?: string;
  personName?: string;
  timeEstimate?: string;
}
