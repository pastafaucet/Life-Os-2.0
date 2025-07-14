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

export interface AppData {
  tasks: Task[];
  cases: Case[];
  people: Person[];
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
