import { Task, Case, Person, AppData } from './types';

const STORAGE_KEYS = {
  TASKS: 'lifeos-tasks',
  CASES: 'lifeos-cases',
  PEOPLE: 'lifeos-people',
  VERSION: 'lifeos-version',
  LAST_SYNC: 'lifeos-last-sync'
} as const;

export class LocalStorage {
  private static isClient = typeof window !== 'undefined';

  // Initialize with sample data if empty
  static initialize() {
    if (!this.isClient) return;
    
    const version = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (!version) {
      // First time setup
      this.setSampleData();
      localStorage.setItem(STORAGE_KEYS.VERSION, '1.0.0');
    }
  }

  // Tasks
  static getTasks(): Task[] {
    if (!this.isClient) return [];
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  }

  static saveTasks(tasks: Task[]) {
    if (!this.isClient) return;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    this.updateLastSync();
  }

  static getTask(id: string): Task | undefined {
    return this.getTasks().find(task => task.id === id);
  }

  static createTask(taskData: Partial<Task>): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskData.title || '',
      type: taskData.type || 'task',
      priority: taskData.priority || 'P2',
      doDate: taskData.doDate || 'Today',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...taskData
    };

    const updatedTasks = [newTask, ...tasks];
    this.saveTasks(updatedTasks);
    return newTask;
  }

  static updateTask(id: string, updates: Partial<Task>): Task | null {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) return null;

    const updatedTask = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    tasks[taskIndex] = updatedTask;
    this.saveTasks(tasks);
    return updatedTask;
  }

  static deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(task => task.id !== id);
    
    if (filteredTasks.length < tasks.length) {
      this.saveTasks(filteredTasks);
      return true;
    }
    return false;
  }

  // Cases
  static getCases(): Case[] {
    if (!this.isClient) return [];
    const data = localStorage.getItem(STORAGE_KEYS.CASES);
    return data ? JSON.parse(data) : [];
  }

  static saveCases(cases: Case[]) {
    if (!this.isClient) return;
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    this.updateLastSync();
  }

  static getCase(id: string): Case | undefined {
    return this.getCases().find(c => c.id === id);
  }

  static createCase(caseData: Partial<Case>): Case {
    const cases = this.getCases();
    const newCase: Case = {
      id: crypto.randomUUID(),
      name: caseData.name || '',
      client: caseData.client || '',
      value: caseData.value || '',
      status: caseData.status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...caseData
    };

    const updatedCases = [newCase, ...cases];
    this.saveCases(updatedCases);
    return newCase;
  }

  static updateCase(id: string, updates: Partial<Case>): Case | null {
    const cases = this.getCases();
    const caseIndex = cases.findIndex(c => c.id === id);
    
    if (caseIndex === -1) return null;

    const updatedCase = {
      ...cases[caseIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    cases[caseIndex] = updatedCase;
    this.saveCases(cases);
    return updatedCase;
  }

  // People
  static getPeople(): Person[] {
    if (!this.isClient) return [];
    const data = localStorage.getItem(STORAGE_KEYS.PEOPLE);
    return data ? JSON.parse(data) : [];
  }

  static savePeople(people: Person[]) {
    if (!this.isClient) return;
    localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
    this.updateLastSync();
  }

  static getPerson(id: string): Person | undefined {
    return this.getPeople().find(p => p.id === id);
  }

  static createPerson(personData: Partial<Person>): Person {
    const people = this.getPeople();
    const newPerson: Person = {
      id: crypto.randomUUID(),
      name: personData.name || '',
      role: personData.role || '',
      phone: personData.phone || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...personData
    };

    const updatedPeople = [newPerson, ...people];
    this.savePeople(updatedPeople);
    return newPerson;
  }

  static updatePerson(id: string, updates: Partial<Person>): Person | null {
    const people = this.getPeople();
    const personIndex = people.findIndex(p => p.id === id);
    
    if (personIndex === -1) return null;

    const updatedPerson = {
      ...people[personIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    people[personIndex] = updatedPerson;
    this.savePeople(people);
    return updatedPerson;
  }

  // Search functions
  static searchCases(query: string): Case[] {
    const cases = this.getCases();
    const lowercaseQuery = query.toLowerCase();
    return cases.filter(c => 
      c.name.toLowerCase().includes(lowercaseQuery) ||
      c.client.toLowerCase().includes(lowercaseQuery)
    );
  }

  static searchPeople(query: string): Person[] {
    const people = this.getPeople();
    const lowercaseQuery = query.toLowerCase();
    return people.filter(p => 
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.role.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Utility functions
  private static updateLastSync() {
    if (!this.isClient) return;
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  // Export all data
  static exportData(): AppData {
    return {
      tasks: this.getTasks(),
      cases: this.getCases(),
      people: this.getPeople(),
      version: '1.0.0',
      lastSync: new Date().toISOString()
    };
  }

  // Import data
  static importData(data: AppData) {
    if (!this.isClient) return;
    
    this.saveTasks(data.tasks);
    this.saveCases(data.cases);
    this.savePeople(data.people);
    localStorage.setItem(STORAGE_KEYS.VERSION, data.version);
  }

  // Clear all data
  static clearAll() {
    if (!this.isClient) return;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  }

  // Sample data for development
  private static setSampleData() {
    const sampleCases: Case[] = [
      {
        id: crypto.randomUUID(),
        name: 'Smith v. Jones',
        client: 'John Smith',
        value: '$125K',
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'Baly v. State Farm',
        client: 'Sarah Baly',
        value: '$450K',
        status: 'Discovery',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'Miller Case',
        client: 'Tech Corp',
        value: '$80K',
        status: 'Settlement',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const samplePeople: Person[] = [
      {
        id: crypto.randomUUID(),
        name: 'Bob Johnson',
        role: 'Opposing Counsel',
        phone: '(555) 123-4567',
        email: 'bob@lawfirm.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'Sarah Chen',
        role: 'Partner',
        phone: '(555) 234-5678',
        email: 'sarah@firm.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'Judge Patricia Williams',
        role: 'Superior Court',
        phone: '(555) 456-7890',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Create sample tasks with relationships
    const sampleTasks: Task[] = [
      {
        id: crypto.randomUUID(),
        title: 'Review quarterly reports',
        type: 'task',
        priority: 'P1',
        doDate: 'Today',
        deadline: '2025-07-20',
        caseId: sampleCases[0].id,
        personId: samplePeople[1].id,
        notes: 'Analyze Q4 performance metrics and prepare summary',
        timeEstimate: '4 hours',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: 'Call Bob Johnson regarding discovery',
        type: 'call',
        priority: 'P1',
        doDate: 'Tomorrow 2:00 PM',
        duration: '30 min',
        caseId: sampleCases[1].id,
        personId: samplePeople[0].id,
        notes: 'Discuss document production timeline',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: 'Draft motion for summary judgment',
        type: 'task',
        priority: 'DEADLINE',
        doDate: 'Wed Jan 15',
        deadline: 'Fri Jan 17',
        caseId: sampleCases[2].id,
        timeEstimate: '6 hours',
        notes: 'Focus on liability issues and precedent cases',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: 'Client meeting preparation',
        type: 'meeting',
        priority: 'P2',
        doDate: 'Next Friday 10:00 AM',
        duration: '1 hour',
        caseId: sampleCases[0].id,
        location: 'Conference Room A',
        attendees: ['John Smith', 'Sarah Chen'],
        notes: 'Prepare settlement discussion materials',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: 'Update case files',
        type: 'task',
        priority: 'QUICK',
        doDate: 'Today',
        timeEstimate: '15 min',
        notes: 'Organize recent documents and correspondence',
        completed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.saveCases(sampleCases);
    this.savePeople(samplePeople);
    this.saveTasks(sampleTasks);
  }
}
