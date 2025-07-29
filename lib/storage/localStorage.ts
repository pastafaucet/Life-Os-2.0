import { Task, Case, Person, Note, Category, Topic, NoteLink, AppData, BulkOperationResult, BulkUpdateData, AIAnalysis } from './types';

const STORAGE_KEYS = {
  TASKS: 'lifeos-tasks',
  CASES: 'lifeos-cases',
  PEOPLE: 'lifeos-people',
  NOTES: 'lifeos-notes',
  CATEGORIES: 'lifeos-categories',
  NOTE_LINKS: 'lifeos-note-links',
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
    
    // Initialize categories if they don't exist
    const categories = this.getCategories();
    if (categories.length === 0) {
      this.initializeDefaultCategories();
    }

    // Migrate existing notes to ensure they have status field
    this.migrateNotesToIncludeStatus();
    
    // Migrate existing notes to ensure they have isFavorite field
    this.migrateNotesToIncludeFavorites();
  }

  // Migrate existing notes to ensure they have status field
  static migrateNotesToIncludeStatus() {
    if (!this.isClient) return;
    
    try {
      const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '[]');
      let needsMigration = false;
      
      const migratedNotes = notes.map((note: any) => {
        if (!note.status) {
          needsMigration = true;
          return {
            ...note,
            status: 'inbox' // Default to inbox for existing notes
          };
        }
        return note;
      });
      
      if (needsMigration) {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(migratedNotes));
        console.log('Migrated notes to include status field');
      }
    } catch (error) {
      console.error('Error migrating notes:', error);
    }
  }

  // Migrate existing notes to ensure they have isFavorite field
  static migrateNotesToIncludeFavorites() {
    if (!this.isClient) return;
    
    try {
      const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '[]');
      let needsMigration = false;
      
      const migratedNotes = notes.map((note: any) => {
        if (note.isFavorite === undefined) {
          needsMigration = true;
          return {
            ...note,
            isFavorite: false // Default to not favorited for existing notes
          };
        }
        return note;
      });
      
      if (needsMigration) {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(migratedNotes));
        console.log('Migrated notes to include isFavorite field');
      }
    } catch (error) {
      console.error('Error migrating notes for favorites:', error);
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

  // Notes
  static getNotes(): Note[] {
    if (!this.isClient) return [];
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    return data ? JSON.parse(data) : [];
  }

  static saveNotes(notes: Note[]) {
    if (!this.isClient) return;
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    this.updateLastSync();
    this.updateCategoryCounts();
  }

  static createNote(noteData: Partial<Note>): Note {
    const notes = this.getNotes();
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: noteData.title || '',
      content: noteData.content || '',
      categoryId: noteData.categoryId || '',
      linkedTopicIds: noteData.linkedTopicIds || [],
      linkedCaseIds: noteData.linkedCaseIds || [],
      linkedTaskIds: noteData.linkedTaskIds || [],
      linkedPersonIds: noteData.linkedPersonIds || [],
      linkedNoteIds: noteData.linkedNoteIds || [],
      tags: noteData.tags || [],
      status: noteData.status || 'inbox', // Default to inbox for new workflow
      isFavorite: noteData.isFavorite || false, // Default to not favorited
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...noteData
    };

    const updatedNotes = [newNote, ...notes];
    this.saveNotes(updatedNotes);
    return newNote;
  }

  static updateNote(id: string, updates: Partial<Note>): Note | null {
    const notes = this.getNotes();
    const noteIndex = notes.findIndex(note => note.id === id);
    
    if (noteIndex === -1) return null;

    const updatedNote = {
      ...notes[noteIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    notes[noteIndex] = updatedNote;
    this.saveNotes(notes);
    return updatedNote;
  }

  static deleteNote(id: string): boolean {
    const notes = this.getNotes();
    const filteredNotes = notes.filter(note => note.id !== id);
    
    if (filteredNotes.length < notes.length) {
      this.saveNotes(filteredNotes);
      return true;
    }
    return false;
  }

  // Favorites Methods
  static toggleNoteFavorite(id: string): { success: boolean; isFavorite: boolean; favoritesCount: number; warning?: string } {
    const notes = this.getNotes();
    const noteIndex = notes.findIndex(note => note.id === id);
    
    if (noteIndex === -1) {
      return { success: false, isFavorite: false, favoritesCount: 0 };
    }

    const currentNote = notes[noteIndex];
    const newFavoriteStatus = !currentNote.isFavorite;
    
    // Check if trying to favorite and already have 10+ favorites
    if (newFavoriteStatus) {
      const currentFavoritesCount = notes.filter(note => note.isFavorite).length;
      if (currentFavoritesCount >= 10) {
        return { 
          success: false, 
          isFavorite: false, 
          favoritesCount: currentFavoritesCount,
          warning: "You can only have up to 10 favorites. Please unfavorite some notes first."
        };
      }
    }

    // Update the note
    const updatedNote = {
      ...currentNote,
      isFavorite: newFavoriteStatus,
      updatedAt: new Date().toISOString()
    };

    notes[noteIndex] = updatedNote;
    this.saveNotes(notes);

    const newFavoritesCount = notes.filter(note => note.isFavorite).length;
    
    return { 
      success: true, 
      isFavorite: newFavoriteStatus, 
      favoritesCount: newFavoritesCount 
    };
  }

  static getFavoriteNotes(): Note[] {
    return this.getNotes().filter(note => note.isFavorite);
  }

  static getFavoritesCount(): number {
    return this.getNotes().filter(note => note.isFavorite).length;
  }

  // Categories
  static getCategories(): Category[] {
    if (!this.isClient) return [];
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : [];
  }

  static saveCategories(categories: Category[]) {
    if (!this.isClient) return;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    this.updateLastSync();
  }

  static createCategory(categoryData: Partial<Category>): Category {
    const categories = this.getCategories();
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: categoryData.name || '',
      color: categoryData.color || '#6B7280',
      icon: categoryData.icon || '📝',
      noteCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...categoryData
    };

    const updatedCategories = [...categories, newCategory];
    this.saveCategories(updatedCategories);
    return newCategory;
  }

  static updateCategoryCounts() {
    const categories = this.getCategories();
    const notes = this.getNotes();
    
    const updatedCategories = categories.map(category => ({
      ...category,
      noteCount: notes.filter(note => note.categoryId === category.id).length
    }));
    
    this.saveCategories(updatedCategories);
  }

  static initializeDefaultCategories() {
    const defaultCategories: Partial<Category>[] = [
      {
        name: 'Notes',
        color: '#3B82F6',
        icon: '📋',
        description: 'General notes and thoughts'
      },
      {
        name: 'References',
        color: '#F59E0B',
        icon: '🔗',
        description: 'Links and reference materials'
      },
      {
        name: 'Media',
        color: '#10B981',
        icon: '📺',
        description: 'Videos, images, and media content'
      },
      {
        name: 'Documents',
        color: '#6B7280',
        icon: '📄',
        description: 'Important documents and files'
      }
    ];

    defaultCategories.forEach(categoryData => {
      this.createCategory(categoryData);
    });
  }

  // Clean up categories to only have the 4 core ones
  static resetToCoreCategoriesOnly() {
    if (!this.isClient) return;

    const coreCategories = ['Notes', 'References', 'Media', 'Documents'];
    const currentCategories = this.getCategories();
    const notes = this.getNotes();
    
    // Create mapping from old categories to new ones
    const categoryMapping: {[key: string]: string} = {};
    
    // Clear all existing categories
    this.saveCategories([]);
    
    // Create the 4 core categories
    const newCategories: Category[] = [];
    const coreData = [
      { name: 'Notes', color: '#3B82F6', icon: '📋', description: 'General notes and thoughts' },
      { name: 'References', color: '#F59E0B', icon: '🔗', description: 'Links and reference materials' },
      { name: 'Media', color: '#10B981', icon: '📺', description: 'Videos, images, and media content' },
      { name: 'Documents', color: '#6B7280', icon: '📄', description: 'Important documents and files' }
    ];
    
    coreData.forEach(categoryData => {
      const newCategory = this.createCategory(categoryData);
      newCategories.push(newCategory);
    });
    
    // Map old category IDs to new ones
    const notesCategory = newCategories.find(c => c.name === 'Notes')!;
    const referencesCategory = newCategories.find(c => c.name === 'References')!;
    const mediaCategory = newCategories.find(c => c.name === 'Media')!;
    const documentsCategory = newCategories.find(c => c.name === 'Documents')!;
    
    // Update all notes to use the new category IDs
    const updatedNotes = notes.map(note => {
      const oldCategory = currentCategories.find(c => c.id === note.categoryId);
      let newCategoryId = notesCategory.id; // Default to Notes
      
      if (oldCategory) {
        const categoryName = oldCategory.name.toLowerCase();
        if (categoryName.includes('reference') || categoryName.includes('link')) {
          newCategoryId = referencesCategory.id;
        } else if (categoryName.includes('media') || categoryName.includes('video') || categoryName.includes('image')) {
          newCategoryId = mediaCategory.id;
        } else if (categoryName.includes('document') || categoryName.includes('file')) {
          newCategoryId = documentsCategory.id;
        }
        // Everything else (including "Meeting Notes", "Ideas", etc.) goes to Notes
      }
      
      return {
        ...note,
        categoryId: newCategoryId
      };
    });
    
    // Save the updated notes
    this.saveNotes(updatedNotes);
    
    console.log('Categories reset to core 4 categories only');
    console.log('Updated', updatedNotes.length, 'notes with new category mappings');
    
    return newCategories;
  }

  // Topics CRUD
  static getTopics(): Topic[] {
    if (!this.isClient) return [];
    const data = localStorage.getItem('lifeos-topics');
    return data ? JSON.parse(data) : [];
  }

  static saveTopics(topics: Topic[]) {
    if (!this.isClient) return;
    localStorage.setItem('lifeos-topics', JSON.stringify(topics));
    this.updateLastSync();
  }

  static createTopic(topicData: Partial<Topic>): Topic {
    const topics = this.getTopics();
    const newTopic: Topic = {
      id: crypto.randomUUID(),
      name: topicData.name || '',
      color: topicData.color || '#f97316',
      noteCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...topicData
    };

    const updatedTopics = [...topics, newTopic];
    this.saveTopics(updatedTopics);
    return newTopic;
  }

  static updateTopic(id: string, updates: Partial<Topic>): Topic | null {
    const topics = this.getTopics();
    const topicIndex = topics.findIndex(t => t.id === id);
    
    if (topicIndex === -1) return null;

    const updatedTopic = {
      ...topics[topicIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    topics[topicIndex] = updatedTopic;
    this.saveTopics(topics);
    return updatedTopic;
  }

  static deleteTopic(id: string): boolean {
    const topics = this.getTopics();
    const filteredTopics = topics.filter(t => t.id !== id);
    
    if (filteredTopics.length < topics.length) {
      this.saveTopics(filteredTopics);
      return true;
    }
    return false;
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
      notes: this.getNotes(),
      categories: this.getCategories(),
      topics: this.getTopics(),
      noteLinks: [], // Will implement later
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
    if (data.notes) this.saveNotes(data.notes);
    if (data.categories) this.saveCategories(data.categories);
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

  // Bulk Operations Methods
  static bulkUpdateNotes(noteIds: string[], updates: BulkUpdateData): BulkOperationResult {
    if (!this.isClient) {
      return { success: false, processed: 0, failed: noteIds.length, errors: ['Client-side only operation'] };
    }

    const notes = this.getNotes();
    const errors: string[] = [];
    let processed = 0;

    const updatedNotes = notes.map(note => {
      if (!noteIds.includes(note.id)) return note;

      try {
        let updatedNote = { ...note };

        // Update category
        if (updates.categoryId) {
          updatedNote.categoryId = updates.categoryId;
        }

        // Add tags
        if (updates.tagsToAdd && updates.tagsToAdd.length > 0) {
          const currentTags = new Set(updatedNote.tags);
          updates.tagsToAdd.forEach(tag => currentTags.add(tag.trim()));
          updatedNote.tags = Array.from(currentTags);
        }

        // Remove tags
        if (updates.tagsToRemove && updates.tagsToRemove.length > 0) {
          updatedNote.tags = updatedNote.tags.filter(tag => !updates.tagsToRemove!.includes(tag));
        }

        // Update status
        if (updates.status) {
          updatedNote.status = updates.status;
        }

        updatedNote.updatedAt = new Date().toISOString();
        processed++;
        return updatedNote;
      } catch (error) {
        errors.push(`Failed to update note ${note.id}: ${error}`);
        return note;
      }
    });

    this.saveNotes(updatedNotes);

    return {
      success: errors.length === 0,
      processed,
      failed: noteIds.length - processed,
      errors
    };
  }

  static bulkDeleteNotes(noteIds: string[]): BulkOperationResult {
    if (!this.isClient) {
      return { success: false, processed: 0, failed: noteIds.length, errors: ['Client-side only operation'] };
    }

    const notes = this.getNotes();
    const initialCount = notes.length;
    const filteredNotes = notes.filter(note => !noteIds.includes(note.id));
    const processed = initialCount - filteredNotes.length;

    this.saveNotes(filteredNotes);

    return {
      success: true,
      processed,
      failed: noteIds.length - processed,
      errors: []
    };
  }

  static getAvailableTags(): string[] {
    const notes = this.getNotes();
    const tagSet = new Set<string>();
    
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  }

  static exportSelectedNotes(noteIds: string[]): { notes: Note[], linkedData: any } {
    const notes = this.getNotes().filter(note => noteIds.includes(note.id));
    const categories = this.getCategories();
    const topics = this.getTopics();
    const cases = this.getCases();
    const people = this.getPeople();

    return {
      notes,
      linkedData: {
        categories,
        topics,
        cases,
        people
      }
    };
  }

  // AI Analysis Storage
  static saveAIAnalysis(analysis: AIAnalysis) {
    if (!this.isClient) return;
    
    const analyses = this.getAIAnalyses();
    const existingIndex = analyses.findIndex(a => a.noteId === analysis.noteId);
    
    if (existingIndex >= 0) {
      analyses[existingIndex] = analysis;
    } else {
      analyses.push(analysis);
    }
    
    localStorage.setItem('lifeos-ai-analyses', JSON.stringify(analyses));
  }

  static getAIAnalyses(): AIAnalysis[] {
    if (!this.isClient) return [];
    const data = localStorage.getItem('lifeos-ai-analyses');
    return data ? JSON.parse(data) : [];
  }

  static getAIAnalysis(noteId: string): AIAnalysis | undefined {
    return this.getAIAnalyses().find(a => a.noteId === noteId);
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
