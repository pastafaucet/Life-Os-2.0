'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { LocalStorage } from '../../lib/storage/localStorage';
import { Note, Category, Topic } from '../../lib/storage/types';
import { Brain, Plus, Search, Edit3, Trash2, Target, TrendingUp, Folder, Link, Save, X, Sparkles, Lightbulb, Zap } from 'lucide-react';
import { analyzeNote, generateKnowledgeInsights } from '../../openai';

export default function KnowledgePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Enhanced note creation state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [linkedCases, setLinkedCases] = useState<string[]>([]);
  const [linkedPeople, setLinkedPeople] = useState<string[]>([]);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);

  // Advanced filtering state
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTags, setFilterTags] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Status workflow state - now supports multiple selections
  const [statusFilter, setStatusFilter] = useState<Set<'inbox' | 'active' | 'done' | 'archived'>>(new Set());
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState({ title: '', content: '' });
  
  // Inline tag editing state
  const [editingTag, setEditingTag] = useState<{ noteId: string; tagIndex: number } | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [addingTagToNote, setAddingTagToNote] = useState<string | null>(null);
  const [newTagValue, setNewTagValue] = useState('');
  
  // Inline editing for other badges
  const [editingPerson, setEditingPerson] = useState<{ noteId: string; personId: string } | null>(null);
  const [editingPersonValue, setEditingPersonValue] = useState('');
  const [editingCase, setEditingCase] = useState<{ noteId: string; caseId: string } | null>(null);
  const [editingCaseValue, setEditingCaseValue] = useState('');
  const [editingTopic, setEditingTopic] = useState<{ noteId: string; topicId: string } | null>(null);
  const [editingTopicValue, setEditingTopicValue] = useState('');

  // AI features state
  const [aiInsights, setAiInsights] = useState<{
    patterns: string[];
    recommendations: string[];
    crossReferences: Array<{ noteId1: string; noteId2: string; connection: string }>;
  } | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [noteAnalysis, setNoteAnalysis] = useState<{[noteId: string]: {
    summary: string;
    suggestedCategory: string;
    keyTopics: string[];
    relevanceScore: number;
    insights: string[];
  }}>({});
  const [isAnalyzingNote, setIsAnalyzingNote] = useState<string | null>(null);
  const [showingAIAnalysis, setShowingAIAnalysis] = useState<string | null>(null);

  // View state
  const [currentView, setCurrentView] = useState<'grid' | 'list' | 'categories' | 'topics' | 'ai-insights' | 'category-detail' | 'topic-detail'>('list');
  
  // Detail view state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [detailViewMode, setDetailViewMode] = useState<'grid' | 'list'>('list');
  const [detailSortBy, setDetailSortBy] = useState<'date' | 'title' | 'relevance'>('date');
  
  // Note expansion state
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  
  // Interactive subtitle state
  const [subtitleMode, setSubtitleMode] = useState(0); // 0=default, 1=notes, 2=articles, 3=references, 4=documents
  
  // Modal editor state
  const [isModalEditorOpen, setIsModalEditorOpen] = useState(false);
  const [modalEditingNote, setModalEditingNote] = useState<{
    id: string;
    title: string;
    content: string;
    categoryId: string;
    tags: string[];
    status: 'inbox' | 'active' | 'done' | 'archived';
  } | null>(null);
  const [modalStack, setModalStack] = useState<'category' | 'topic' | null>(null); // Track which modal opened the editor

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<Category | null>(null);
  const [categoryModalView, setCategoryModalView] = useState<'list' | 'grid'>('list');
  const [categoryModalSort, setCategoryModalSort] = useState<'date' | 'title' | 'tags'>('date');
  
  // Topic modal state
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [selectedTopicForModal, setSelectedTopicForModal] = useState<Topic | null>(null);
  const [topicModalView, setTopicModalView] = useState<'list' | 'grid'>('list');
  const [topicModalSort, setTopicModalSort] = useState<'date' | 'title' | 'tags'>('date');

  // Inbox processing state
  const [isInboxProcessingMode, setIsInboxProcessingMode] = useState(false);
  const [processedNoteIds, setProcessedNoteIds] = useState<Set<string>>(new Set());
  const [snoozedNotes, setSnoozedNotes] = useState<{[noteId: string]: Date}>({});

  useEffect(() => {
    LocalStorage.initialize();
    
    // Clean up categories to only have the 4 core ones
    LocalStorage.resetToCoreCategoriesOnly();
    
    loadData();
    setInitialized(true);
  }, []);

  // Auto-trigger inbox processing mode when >10 notes
  // Inbox processing helpers
  const inboxNotes = notes.filter(note => note.status === 'inbox' && !snoozedNotes[note.id]);
  const hasAgingNotes = inboxNotes.some(note => {
    const noteDate = new Date(note.createdAt);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return noteDate < threeDaysAgo;
  });

  const getAgeInDays = (dateString: string) => {
    const noteDate = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - noteDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getAgeIcon = (days: number) => {
    if (days >= 5) return '🔥';
    if (days >= 3) return '⚠️';
    return '📝';
  };

  const getAgeColor = (days: number) => {
    if (days >= 5) return 'text-red-400';
    if (days >= 3) return 'text-orange-400';
    return 'text-gray-400';
  };

  const snoozeNote = (noteId: string, days: number) => {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + days);
    setSnoozedNotes(prev => ({
      ...prev,
      [noteId]: snoozeUntil
    }));
  };

  const moveNoteToStatus = (noteId: string, newStatus: 'active' | 'done' | 'archived') => {
    LocalStorage.updateNote(noteId, { 
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    setProcessedNoteIds(prev => new Set([...prev, noteId]));
    loadData();
  };

  const enterInboxProcessingMode = () => {
    setIsInboxProcessingMode(true);
    setProcessedNoteIds(new Set());
    setStatusFilter(new Set(['inbox'])); // Set to show only inbox notes
    setCurrentView('list'); // Ensure we're in list view for processing
  };

  const exitInboxProcessingMode = () => {
    setIsInboxProcessingMode(false);
    setProcessedNoteIds(new Set());
  };

  useEffect(() => {
    if (notes.length > 0) { // Only run after notes are loaded
      if (inboxNotes.length > 10 && !isInboxProcessingMode) {
        // Show prompt for auto-trigger
        const shouldEnter = window.confirm(`Ready to process your inbox? (${inboxNotes.length} notes waiting)`);
        if (shouldEnter) {
          enterInboxProcessingMode();
        }
      }
    }
  }, [notes.length, isInboxProcessingMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Modal editor shortcuts
      if (isModalEditorOpen) {
        // Ctrl+S or Cmd+S to save
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
          event.preventDefault();
          saveModalEdit();
          return;
        }
        
        // ESC to cancel - only handle modal editor escape here
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          cancelModalEdit();
          return;
        }
      }
      
      // Handle escape for other modals only when note editor is NOT open
      if (!isModalEditorOpen && event.key === 'Escape') {
        console.log('ESC pressed, modal states:', { isCategoryModalOpen, isTopicModalOpen });
        
        // Close category modal if open
        if (isCategoryModalOpen) {
          console.log('Closing category modal');
          event.preventDefault();
          event.stopPropagation();
          setIsCategoryModalOpen(false);
          setSelectedCategoryForModal(null);
          return;
        }
        
        // Close topic modal if open
        if (isTopicModalOpen) {
          console.log('Closing topic modal');
          event.preventDefault();
          event.stopPropagation();
          setIsTopicModalOpen(false);
          setSelectedTopicForModal(null);
          return;
        }
      }
      
      // Global shortcuts (only when modal is not open)
      if (!isModalEditorOpen) {
        // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault(); // Prevent browser's default Ctrl+K behavior
          event.stopPropagation();
          
          console.log('Ctrl+K detected'); // Debug log
          
          // Focus the note input field with multiple selectors as fallback
          const noteInput = document.querySelector('input[placeholder*="Capture a thought"]') as HTMLInputElement ||
                           document.querySelector('input[placeholder*="capture"]') as HTMLInputElement ||
                           document.querySelector('.note-input') as HTMLInputElement;
                           
          console.log('Found input:', noteInput); // Debug log
          
          if (noteInput) {
            noteInput.focus();
            noteInput.select(); // Select any existing text
            console.log('Input focused'); // Debug log
          } else {
            console.log('Input not found'); // Debug log
          }
        }
      }
    };

    // Add event listener to document instead of window
    document.addEventListener('keydown', handleKeyDown, true);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isModalEditorOpen, isCategoryModalOpen, isTopicModalOpen]);

  const loadData = () => {
    setNotes(LocalStorage.getNotes());
    setCategories(LocalStorage.getCategories());
    setTopics(LocalStorage.getTopics());
    setCases(LocalStorage.getCases());
    setPeople(LocalStorage.getPeople());
  };

  const loadNotes = () => {
    setNotes(LocalStorage.getNotes());
  };

  const createNote = async () => {
    if (showAdvancedForm) {
      if (!noteTitle.trim() || !noteContent.trim()) return;
      
      const createdNote = LocalStorage.createNote({
        title: noteTitle,
        content: noteContent,
        categoryId: selectedCategory || (categories.find(cat => cat.name === 'Notes')?.id || categories[0]?.id || 'notes-default'),
        linkedTopicIds: [],
        linkedCaseIds: linkedCases,
        linkedPersonIds: linkedPeople,
        tags: tags
      });

      // Analyze the note with AI
      if (noteContent.trim().length > 10) {
        try {
          setIsAnalyzingNote(createdNote.id);
          const analysis = await analyzeNote(noteContent);
          setNoteAnalysis(prev => ({
            ...prev,
            [createdNote.id]: analysis
          }));
        } catch (error) {
          console.error('Failed to analyze note:', error);
        } finally {
          setIsAnalyzingNote(null);
        }
      }
      
      // Reset form
      setNoteTitle('');
      setNoteContent('');
      setSelectedCategory('');
      setTags([]);
      setTagInput('');
      setLinkedCases([]);
      setLinkedPeople([]);
      setShowAdvancedForm(false);
    } else {
      if (!newNote.trim()) return;
      
      // Parse symbols from the note text
      const parseSymbols = (text: string) => {
        const caseMatches = text.match(/#([A-Za-z][A-Za-z0-9]*)/g) || [];
        const personMatches = text.match(/@([A-Za-z][A-Za-z0-9]*)/g) || [];
        const topicMatches = text.match(/~([A-Za-z][A-Za-z0-9]*)/g) || [];
        const tagMatches = text.match(/\+([A-Za-z][A-Za-z0-9]*)/g) || [];
        
        return {
          cases: caseMatches.map(match => match.substring(1)), // Remove # symbol
          people: personMatches.map(match => match.substring(1)), // Remove @ symbol
          topics: topicMatches.map(match => match.substring(1)), // Remove ~ symbol
          tags: tagMatches.map(match => match.substring(1)) // Remove + symbol
        };
      };
      
      const parsed = parseSymbols(newNote);
      
      // Create cases and people if they don't exist, get their IDs
      const linkedCaseIds: string[] = [];
      const linkedPersonIds: string[] = [];
      const linkedTopicIds: string[] = [];
      
      // Handle cases
      for (const caseName of parsed.cases) {
        let existingCase = cases.find(c => c.name.toLowerCase() === caseName.toLowerCase());
        if (!existingCase) {
          const newCase = LocalStorage.createCase({
            name: caseName,
            status: 'Active'
          });
          linkedCaseIds.push(newCase.id);
        } else {
          linkedCaseIds.push(existingCase.id);
        }
      }
      
      // Handle people
      for (const personName of parsed.people) {
        let existingPerson = people.find(p => p.name.toLowerCase() === personName.toLowerCase());
        if (!existingPerson) {
          const newPerson = LocalStorage.createPerson({
            name: personName,
            email: '',
            phone: '',
            role: 'contact'
          });
          linkedPersonIds.push(newPerson.id);
        } else {
          linkedPersonIds.push(existingPerson.id);
        }
      }
      
      // Handle topics
      for (const topicName of parsed.topics) {
        let existingTopic = topics.find(t => t.name.toLowerCase() === topicName.toLowerCase());
        if (!existingTopic) {
          const newTopic = LocalStorage.createTopic({
            name: topicName,
            description: `Auto-created from note: ${newNote.substring(0, 50)}...`,
            color: 'orange'
          });
          linkedTopicIds.push(newTopic.id);
        } else {
          linkedTopicIds.push(existingTopic.id);
        }
      }
      
      // Auto-detect category based on keywords
      const content = newNote.toLowerCase();
      
      // Find the exact "Notes" category (not "Meeting Notes" or others)
      const notesCategory = categories.find(cat => cat.name === 'Notes' && cat.name.length === 5);
      let detectedCategory = notesCategory?.id || categories.find(cat => cat.name === 'Notes')?.id || categories[0]?.id || 'notes-default';
      
      // Map keywords to the 4 core categories only
      if (content.includes('video') || content.includes('image') || content.includes('media') || 
          content.includes('photo') || content.includes('youtube') || content.includes('vimeo') || 
          content.includes('watch') || content.includes('podcast')) {
        const mediaCategory = categories.find(cat => cat.name === 'Media');
        if (mediaCategory) detectedCategory = mediaCategory.id;
      } else if (content.includes('reference') || content.includes('ref') || content.includes('guide') || 
                 content.includes('manual') || content.includes('resource') || content.includes('documentation') ||
                 content.includes('link') || content.includes('http') || content.includes('url')) {
        const referencesCategory = categories.find(cat => cat.name === 'References');
        if (referencesCategory) detectedCategory = referencesCategory.id;
      } else if (content.includes('document') || content.includes('file') || content.includes('pdf') || 
                 content.includes('contract') || content.includes('agreement') || content.includes('report') || 
                 content.includes('legal')) {
        const documentsCategory = categories.find(cat => cat.name === 'Documents');
        if (documentsCategory) detectedCategory = documentsCategory.id;
      }
      // Everything else (including meeting, call, idea, think, etc.) goes to Notes (default)
      
      // Create clean title - only keep people names, remove everything else that's parsable
      let cleanTitle = newNote;
      
      console.log('Original note:', newNote);
      
      // Remove cases, topics, and tags completely from title (more explicit approach)
      cleanTitle = cleanTitle.replace(/#[A-Za-z0-9]+/g, ''); // Remove #Baly entirely
      cleanTitle = cleanTitle.replace(/~[A-Za-z0-9]+/g, ''); // Remove ~Topic entirely  
      cleanTitle = cleanTitle.replace(/\+[A-Za-z0-9]+/g, ''); // Remove +tag entirely
      
      console.log('After removing symbols:', cleanTitle);
      
      // Keep people names but remove @ symbol
      cleanTitle = cleanTitle.replace(/@([A-Za-z0-9]+)/g, '$1'); // @Bob -> Bob
      
      // Clean up extra spaces that might result from removals
      cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
      
      console.log('Final clean title:', cleanTitle);
      
      const createdNote = LocalStorage.createNote({
        title: cleanTitle.length > 50 ? cleanTitle.substring(0, 50) + '...' : cleanTitle,
        content: '', // Content should be empty after parsing symbols
        categoryId: detectedCategory,
        linkedTopicIds: linkedTopicIds,
        linkedCaseIds: linkedCaseIds,
        linkedPersonIds: linkedPersonIds,
        tags: parsed.tags
      });

      setNewNote('');
      
      // Update UI immediately (optimistic update)
      loadData();

      // Analyze the note with AI in the background (non-blocking)
      if (cleanTitle.trim().length > 10) {
        analyzeNoteAsync(createdNote.id, cleanTitle);
      }
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeFormTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const deleteNote = (noteId: string) => {
    LocalStorage.deleteNote(noteId);
    loadData();
  };

  const startEditing = (note: Note, fromModal?: 'category' | 'topic') => {
    // Use modal editor instead of inline editing
    setModalEditingNote({
      id: note.id,
      title: note.title,
      content: note.content,
      categoryId: note.categoryId,
      tags: note.tags,
      status: note.status
    });
    setModalStack(fromModal || null);
    setIsModalEditorOpen(true);
  };

  const saveModalEdit = async () => {
    if (!modalEditingNote) return;
    
    if (modalEditingNote.id) {
      // Update existing note
      LocalStorage.updateNote(modalEditingNote.id, {
        title: modalEditingNote.title,
        content: modalEditingNote.content,
        categoryId: modalEditingNote.categoryId,
        tags: modalEditingNote.tags,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new note
      const createdNote = LocalStorage.createNote({
        title: modalEditingNote.title,
        content: modalEditingNote.content,
        categoryId: modalEditingNote.categoryId,
        tags: modalEditingNote.tags
      });

      // Analyze the note with AI if it has meaningful content
      if (modalEditingNote.content.trim().length > 10) {
        try {
          setIsAnalyzingNote(createdNote.id);
          const analysis = await analyzeNote(modalEditingNote.content);
          setNoteAnalysis(prev => ({
            ...prev,
            [createdNote.id]: analysis
          }));
        } catch (error) {
          console.error('Failed to analyze note:', error);
        } finally {
          setIsAnalyzingNote(null);
        }
      }
    }
    
    setIsModalEditorOpen(false);
    setModalEditingNote(null);
    setModalStack(null);
    loadData();
  };

  const startCapture = () => {
    // Use modal editor for creating new notes
    setModalEditingNote({
      id: '', // Empty ID means new note
      title: '',
      content: '',
      categoryId: categories.find(cat => cat.name === 'Notes')?.id || categories[0]?.id || '',
      tags: [],
      status: 'inbox' // Default to inbox for new notes
    });
    setIsModalEditorOpen(true);
  };

  const cancelModalEdit = () => {
    setIsModalEditorOpen(false);
    setModalEditingNote(null);
    
    // If we came from a category/topic modal, go back to it
    if (modalStack === 'category') {
      // Category modal should already be open
      setModalStack(null);
    } else if (modalStack === 'topic') {
      // Topic modal should already be open
      setModalStack(null);
    }
    // If no modal stack, we just close everything
  };

  // Legacy inline editing functions (kept for compatibility)
  const saveEdit = () => {
    if (!editingNoteId) return;
    
    LocalStorage.updateNote(editingNoteId, {
      title: editingNote.title,
      content: editingNote.content,
      updatedAt: new Date().toISOString()
    });
    
    setEditingNoteId(null);
    setEditingNote({ title: '', content: '' });
    loadData();
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditingNote({ title: '', content: '' });
  };

  const startEditingTag = (noteId: string, tagIndex: number, currentValue: string) => {
    setEditingTag({ noteId, tagIndex });
    setEditingTagValue(currentValue);
  };

  const saveEditingTag = () => {
    if (!editingTag || !editingTagValue.trim()) {
      cancelEditingTag();
      return;
    }

    const note = notes.find(n => n.id === editingTag.noteId);
    if (note) {
      const updatedTags = [...note.tags];
      updatedTags[editingTag.tagIndex] = editingTagValue.trim();
      LocalStorage.updateNote(editingTag.noteId, { tags: updatedTags });
      loadData();
    }
    
    setEditingTag(null);
    setEditingTagValue('');
  };

  const cancelEditingTag = () => {
    setEditingTag(null);
    setEditingTagValue('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditingTag();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingTag();
    }
  };

  const startAddingTag = (noteId: string) => {
    setAddingTagToNote(noteId);
    setNewTagValue('');
  };

  const saveNewTag = () => {
    if (!addingTagToNote || !newTagValue.trim()) {
      cancelAddingTag();
      return;
    }

    const note = notes.find(n => n.id === addingTagToNote);
    if (note && !note.tags.includes(newTagValue.trim())) {
      const updatedTags = [...note.tags, newTagValue.trim()];
      LocalStorage.updateNote(addingTagToNote, { tags: updatedTags });
      loadData();
    }
    
    setAddingTagToNote(null);
    setNewTagValue('');
  };

  const cancelAddingTag = () => {
    setAddingTagToNote(null);
    setNewTagValue('');
  };

  const handleNewTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveNewTag();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelAddingTag();
    }
  };

  const removeTag = (noteId: string, tagToRemove: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const updatedTags = note.tags.filter(tag => tag !== tagToRemove);
      LocalStorage.updateNote(noteId, { tags: updatedTags });
      loadData();
    }
  };

  // Inline editing functions for Person badges
  const startEditingPerson = (noteId: string, personId: string, currentValue: string) => {
    setEditingPerson({ noteId, personId });
    setEditingPersonValue(currentValue);
  };

  const saveEditingPerson = () => {
    if (!editingPerson || !editingPersonValue.trim()) {
      cancelEditingPerson();
      return;
    }

    LocalStorage.updatePerson(editingPerson.personId, { name: editingPersonValue.trim() });
    loadData();
    setEditingPerson(null);
    setEditingPersonValue('');
  };

  const cancelEditingPerson = () => {
    setEditingPerson(null);
    setEditingPersonValue('');
  };

  const handlePersonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditingPerson();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingPerson();
    }
  };

  // Inline editing functions for Case badges
  const startEditingCase = (noteId: string, caseId: string, currentValue: string) => {
    setEditingCase({ noteId, caseId });
    setEditingCaseValue(currentValue);
  };

  const saveEditingCase = () => {
    if (!editingCase || !editingCaseValue.trim()) {
      cancelEditingCase();
      return;
    }

    LocalStorage.updateCase(editingCase.caseId, { name: editingCaseValue.trim() });
    loadData();
    setEditingCase(null);
    setEditingCaseValue('');
  };

  const cancelEditingCase = () => {
    setEditingCase(null);
    setEditingCaseValue('');
  };

  const handleCaseKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditingCase();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingCase();
    }
  };

  // Inline editing functions for Topic badges
  const startEditingTopic = (noteId: string, topicId: string, currentValue: string) => {
    setEditingTopic({ noteId, topicId });
    setEditingTopicValue(currentValue);
  };

  const saveEditingTopic = () => {
    if (!editingTopic || !editingTopicValue.trim()) {
      cancelEditingTopic();
      return;
    }

    LocalStorage.updateTopic(editingTopic.topicId, { name: editingTopicValue.trim() });
    loadData();
    setEditingTopic(null);
    setEditingTopicValue('');
  };

  const cancelEditingTopic = () => {
    setEditingTopic(null);
    setEditingTopicValue('');
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditingTopic();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingTopic();
    }
  };

  const generateAIInsights = async () => {
    if (notes.length === 0) return;
    
    setIsGeneratingInsights(true);
    try {
      const insights = await generateKnowledgeInsights(notes);
      setAiInsights(insights);
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const analyzeNoteAsync = (noteId: string, content: string) => {
    // Clean content and ensure minimum length
    const cleanContent = content.trim();
    if (!cleanContent || cleanContent.length < 5) {
      console.log('Content too short for analysis:', cleanContent);
      return;
    }
    
    console.log('Starting background AI analysis for note:', noteId, 'Content:', cleanContent);
    setIsAnalyzingNote(noteId);
    
    // Fire-and-forget AI analysis (non-blocking)
    analyzeNote(cleanContent)
      .then(analysis => {
        console.log('Background AI analysis completed:', analysis);
        setNoteAnalysis(prev => ({
          ...prev,
          [noteId]: analysis
        }));
      })
      .catch(error => {
        console.error('Failed to analyze note in background:', error);
      })
      .finally(() => {
        setIsAnalyzingNote(null);
      });
  };

  const analyzeNoteManually = async (noteId: string, content: string) => {
    // Clean content and ensure minimum length
    const cleanContent = content.trim();
    if (!cleanContent || cleanContent.length < 5) {
      console.log('Content too short for analysis:', cleanContent);
      return;
    }
    
    console.log('Starting AI analysis for note:', noteId, 'Content:', cleanContent);
    setIsAnalyzingNote(noteId);
    
    try {
      const analysis = await analyzeNote(cleanContent);
      console.log('AI analysis completed:', analysis);
      setNoteAnalysis(prev => ({
        ...prev,
        [noteId]: analysis
      }));
      
      // Show the analysis immediately after it's generated
      setShowingAIAnalysis(noteId);
    } catch (error) {
      console.error('Failed to analyze note:', error);
      alert('Failed to analyze note. Please check the console for details.');
    } finally {
      setIsAnalyzingNote(null);
    }
  };

  // Calculate knowledge stats
  const totalNotes = notes.length;
  const activeCategories = categories.filter(cat => cat.noteCount > 0).length;
  const notesToday = notes.filter(note => {
    const noteDate = new Date(note.createdAt);
    const today = new Date();
    return noteDate.toDateString() === today.toDateString();
  }).length;
  
  const mostActiveCategory = categories.reduce((prev, current) => 
    (current.noteCount > prev.noteCount) ? current : prev, 
    { name: 'None', noteCount: 0 }
  );
  
  const linkedItemsCount = notes.reduce((count, note) => 
    count + note.linkedCaseIds.length + note.linkedPersonIds.length, 0
  );
  
  const knowledgeHealth = Math.round(
    ((notes.filter(note => {
      const notesCategory = categories.find(cat => cat.name === 'Notes');
      return note.categoryId !== notesCategory?.id;
    }).length / Math.max(totalNotes, 1)) * 40) +
    ((linkedItemsCount / Math.max(totalNotes, 1)) * 30) +
    ((notes.filter(note => note.tags.length > 0).length / Math.max(totalNotes, 1)) * 30)
  );

  // Enhanced stats with better visuals and data
  const knowledgeStats = [
    {
      label: "Total Notes",
      value: totalNotes.toString(),
      change: `+${notesToday} today`,
      changeType: notesToday > 0 ? "positive" : "neutral",
      icon: Brain,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      emoji: "🧠"
    },
    {
      label: "Active Categories",
      value: activeCategories.toString(),
      change: `${categories.length} total`,
      changeType: "neutral",
      icon: Folder,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400",
      emoji: "📁"
    },
    {
      label: "Notes Today",
      value: notesToday.toString(),
      change: notesToday > 0 ? "Great progress!" : "Add some notes",
      changeType: notesToday > 0 ? "positive" : "neutral",
      icon: Plus,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-400",
      emoji: "📝"
    },
    {
      label: "Most Active",
      value: mostActiveCategory.name,
      change: `${mostActiveCategory.noteCount} notes`,
      changeType: "neutral",
      icon: TrendingUp,
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-400",
      emoji: "⭐"
    },
    {
      label: "Linked Items",
      value: linkedItemsCount.toString(),
      change: linkedItemsCount > 0 ? "Well connected" : "Add links",
      changeType: linkedItemsCount > 0 ? "positive" : "neutral",
      icon: Link,
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
      emoji: "🔗"
    },
    {
      label: "Knowledge Health",
      value: `${knowledgeHealth}%`,
      change: knowledgeHealth > 70 ? "Excellent!" : knowledgeHealth > 40 ? "Good" : "Needs work",
      changeType: knowledgeHealth > 70 ? "positive" : knowledgeHealth > 40 ? "neutral" : "negative",
      icon: Target,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
      emoji: "🎯"
    }
  ];

  // Advanced filtering logic
  const filteredNotes = notes.filter(note => {
    // Text search
    if (searchQuery && !note.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !note.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (filterCategory && note.categoryId !== filterCategory) {
      return false;
    }
    
    // Status filter (legacy)
    if (filterStatus && note.status !== filterStatus) {
      return false;
    }
    
    // New status filter - handle multiple selections
    if (statusFilter.size > 0 && !statusFilter.has(note.status)) {
      return false;
    }
    
    // Tag filter
    if (filterTags) {
      const filterTagsList = filterTags.toLowerCase().split(',').map(tag => tag.trim());
      if (!filterTagsList.some(filterTag => 
        note.tags.some(noteTag => noteTag.toLowerCase().includes(filterTag))
      )) {
        return false;
      }
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      const noteDate = new Date(note.createdAt);
      if (dateFrom && noteDate < new Date(dateFrom)) {
        return false;
      }
      if (dateTo && noteDate > new Date(dateTo)) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Get unique tags for suggestions
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

  // Interactive subtitle functionality
  const subtitleTexts = [
    "Your personal knowledge management system",
    "📋 Notes - General notes and thoughts", 
    "� References - Links and reference materials",
    "� Media - Videos, images, and media content",
    "📄 Documents - Important documents and files"
  ];

  const cycleSubtitle = () => {
    console.log('Cycling subtitle from', subtitleMode, 'to', (subtitleMode + 1) % subtitleTexts.length);
    setSubtitleMode((prev) => (prev + 1) % subtitleTexts.length);
  };

  const cycleCategoryForNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // Only cycle through the 4 core categories
    const coreCategories = ['Notes', 'References', 'Media', 'Documents'];
    const availableCategories = categories.filter(cat => coreCategories.includes(cat.name));
    
    if (availableCategories.length === 0) return;

    // Find current category in core categories
    const currentCategory = categories.find(cat => cat.id === note.categoryId);
    const currentIndex = availableCategories.findIndex(cat => cat.id === currentCategory?.id);
    
    // Calculate next category index (loop back to 0 if at end)
    const nextIndex = (currentIndex + 1) % availableCategories.length;
    const nextCategory = availableCategories[nextIndex];

    // Update the note's category
    LocalStorage.updateNote(noteId, { 
      categoryId: nextCategory.id,
      updatedAt: new Date().toISOString()
    });

    // Reload data to reflect changes
    loadData();
    
    console.log(`Cycled note ${noteId} from ${currentCategory?.name || 'Unknown'} to ${nextCategory.name}`);
  };

  const cycleStatusForNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // Status progression: inbox → active → done → archived → inbox
    const statusProgression: { [key: string]: 'inbox' | 'active' | 'done' | 'archived' } = {
      'inbox': 'active',
      'active': 'done', 
      'done': 'archived',
      'archived': 'inbox'
    };

    const nextStatus = statusProgression[note.status] || 'inbox';

    // Update the note's status
    LocalStorage.updateNote(noteId, { 
      status: nextStatus,
      updatedAt: new Date().toISOString()
    });

    // Reload data to reflect changes
    loadData();
    
    console.log(`Cycled note ${noteId} from ${note.status} to ${nextStatus}`);
  };

  // Status styling helper
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'inbox':
        return {
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          border: 'border-gray-500/30',
          icon: '📥'
        };
      case 'active':
        return {
          bg: 'bg-blue-500/20',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          icon: '🔄'
        };
      case 'done':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          border: 'border-green-500/30',
          icon: '✅'
        };
      case 'archived':
        return {
          bg: 'bg-purple-500/20',
          text: 'text-purple-400',
          border: 'border-purple-500/30',
          icon: '📦'
        };
      default:
        return {
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          border: 'border-gray-500/30',
          icon: '📥'
        };
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navigation />
      
      {/* Category Detail Modal */}
      {isCategoryModalOpen && selectedCategoryForModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{selectedCategoryForModal.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCategoryForModal.name}</h2>
                  <p className="text-gray-400">{selectedCategoryForModal.description}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Controls */}
            <div className="p-6 border-b border-gray-700 bg-gray-800/30">
              <div className="flex items-center justify-between">
                {/* Metrics */}
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {notes.filter(note => note.categoryId === selectedCategoryForModal.id).length}
                    </div>
                    <div className="text-xs text-gray-400">Total Notes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {notes.filter(note => {
                        const noteDate = new Date(note.createdAt);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return note.categoryId === selectedCategoryForModal.id && noteDate >= weekAgo;
                      }).length}
                    </div>
                    <div className="text-xs text-gray-400">This Week</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {Array.from(new Set(notes.filter(note => note.categoryId === selectedCategoryForModal.id)
                        .flatMap(note => note.tags))).length}
                    </div>
                    <div className="text-xs text-gray-400">Unique Tags</div>
                  </div>
                </div>

                {/* View Controls */}
                <div className="flex items-center space-x-4">
                  {/* Sort Options */}
                  <select
                    value={categoryModalSort}
                    onChange={(e) => setCategoryModalSort(e.target.value as 'date' | 'title' | 'tags')}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="title">Sort by Title</option>
                    <option value="tags">Sort by Tags</option>
                  </select>

                  {/* View Toggle */}
                  <div className="flex items-center space-x-1 bg-gray-800 border border-gray-600 rounded-lg p-1">
                    <button
                      onClick={() => setCategoryModalView('list')}
                      className={`p-2 rounded transition-all ${
                        categoryModalView === 'list' 
                          ? 'bg-purple-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      📋
                    </button>
                    <button
                      onClick={() => setCategoryModalView('grid')}
                      className={`p-2 rounded transition-all ${
                        categoryModalView === 'grid' 
                          ? 'bg-purple-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      ⊞
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {(() => {
                let categoryNotes = notes.filter(note => note.categoryId === selectedCategoryForModal.id);
                
                // Apply sorting
                categoryNotes = categoryNotes.sort((a, b) => {
                  switch (categoryModalSort) {
                    case 'title':
                      return a.title.localeCompare(b.title);
                    case 'tags':
                      return b.tags.length - a.tags.length;
                    case 'date':
                    default:
                      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                  }
                });

                if (categoryNotes.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      <span className="text-4xl mb-4 block">{selectedCategoryForModal.icon}</span>
                      <h3 className="text-lg font-medium mb-2">No notes in this category yet</h3>
                      <p className="text-sm">Create some notes to see them here</p>
                    </div>
                  );
                }

                if (categoryModalView === 'grid') {
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryNotes.map((note) => (
                        <div key={note.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all cursor-pointer" onClick={() => startEditing(note, 'category')}>
                          <h4 className="font-medium text-white mb-2 line-clamp-2">{note.title}</h4>
                          {note.content && (
                            <p className="text-sm text-gray-400 mb-3 line-clamp-3">{note.content}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {note.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                                +{tag}
                              </span>
                            ))}
                            {note.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{note.tags.length - 3} more</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {new Date(note.updatedAt).toLocaleDateString()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(note, 'category');
                              }}
                              className="p-1 text-gray-500 hover:text-blue-400 transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div className="space-y-3">
                      {categoryNotes.map((note) => (
                        <div key={note.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all cursor-pointer" onClick={() => startEditing(note, 'category')}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-white mb-2">{note.title}</h4>
                              {note.content && (
                                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{note.content}</p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {note.tags.map((tag, index) => (
                                  <span key={index} className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                                    +{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 ml-4">
                              <span className="text-xs text-gray-500">
                                {new Date(note.updatedAt).toLocaleDateString()}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(note, 'category');
                                }}
                                className="p-2 text-gray-500 hover:text-blue-400 transition-colors"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Topic Detail Modal */}
      {isTopicModalOpen && selectedTopicForModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-4">
                <span className="text-3xl">🏷️</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedTopicForModal.name}</h2>
                  <p className="text-gray-400">{selectedTopicForModal.description}</p>
                </div>
              </div>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Controls */}
            <div className="p-6 border-b border-gray-700 bg-gray-800/30">
              <div className="flex items-center justify-between">
                {/* Metrics */}
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {notes.filter(note => note.linkedTopicIds.includes(selectedTopicForModal.id)).length}
                    </div>
                    <div className="text-xs text-gray-400">Total Notes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {notes.filter(note => {
                        const noteDate = new Date(note.createdAt);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return note.linkedTopicIds.includes(selectedTopicForModal.id) && noteDate >= weekAgo;
                      }).length}
                    </div>
                    <div className="text-xs text-gray-400">This Week</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {Array.from(new Set(notes.filter(note => note.linkedTopicIds.includes(selectedTopicForModal.id))
                        .flatMap(note => note.tags))).length}
                    </div>
                    <div className="text-xs text-gray-400">Unique Tags</div>
                  </div>
                </div>

                {/* View Controls */}
                <div className="flex items-center space-x-4">
                  {/* Sort Options */}
                  <select
                    value={topicModalSort}
                    onChange={(e) => setTopicModalSort(e.target.value as 'date' | 'title' | 'tags')}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="title">Sort by Title</option>
                    <option value="tags">Sort by Tags</option>
                  </select>

                  {/* View Toggle */}
                  <div className="flex items-center space-x-1 bg-gray-800 border border-gray-600 rounded-lg p-1">
                    <button
                      onClick={() => setTopicModalView('list')}
                      className={`p-2 rounded transition-all ${
                        topicModalView === 'list' 
                          ? 'bg-purple-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      📋
                    </button>
                    <button
                      onClick={() => setTopicModalView('grid')}
                      className={`p-2 rounded transition-all ${
                        topicModalView === 'grid' 
                          ? 'bg-purple-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      ⊞
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {(() => {
                let topicNotes = notes.filter(note => note.linkedTopicIds.includes(selectedTopicForModal.id));
                
                // Apply sorting
                topicNotes = topicNotes.sort((a, b) => {
                  switch (topicModalSort) {
                    case 'title':
                      return a.title.localeCompare(b.title);
                    case 'tags':
                      return b.tags.length - a.tags.length;
                    case 'date':
                    default:
                      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                  }
                });

                if (topicNotes.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      <span className="text-4xl mb-4 block">🏷️</span>
                      <h3 className="text-lg font-medium mb-2">No notes with this topic yet</h3>
                      <p className="text-sm">Create notes with ~{selectedTopicForModal.name} to see them here</p>
                    </div>
                  );
                }

                if (topicModalView === 'grid') {
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topicNotes.map((note) => {
                        const category = categories.find(cat => cat.id === note.categoryId);
                        return (
                          <div key={note.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all cursor-pointer" onClick={() => startEditing(note, 'topic')}>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-white line-clamp-2 flex-1">{note.title}</h4>
                              {category && (
                                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded ml-2">
                                  {category.icon}
                                </span>
                              )}
                            </div>
                            {note.content && (
                              <p className="text-sm text-gray-400 mb-3 line-clamp-3">{note.content}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mb-3">
                              {note.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                                  +{tag}
                                </span>
                              ))}
                              {note.tags.length > 3 && (
                                <span className="text-xs text-gray-500">+{note.tags.length - 3} more</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {new Date(note.updatedAt).toLocaleDateString()}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(note, 'topic');
                                }}
                                className="p-1 text-gray-500 hover:text-blue-400 transition-colors"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                } else {
                  return (
                    <div className="space-y-3">
                      {topicNotes.map((note) => {
                        const category = categories.find(cat => cat.id === note.categoryId);
                        return (
                          <div key={note.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all cursor-pointer" onClick={() => startEditing(note, 'topic')}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-medium text-white">{note.title}</h4>
                                  {category && (
                                    <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                                      {category.icon} {category.name}
                                    </span>
                                  )}
                                </div>
                                {note.content && (
                                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{note.content}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  {note.tags.map((tag, index) => (
                                    <span key={index} className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                                      +{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 ml-4">
                                <span className="text-xs text-gray-500">
                                  {new Date(note.updatedAt).toLocaleDateString()}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(note, 'topic');
                                  }}
                                  className="p-2 text-gray-500 hover:text-blue-400 transition-colors"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal Editor */}
      {isModalEditorOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                {modalEditingNote?.id ? (
                  <>
                    <Edit3 className="h-6 w-6 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Edit Note</h2>
                  </>
                ) : (
                  <>
                    <Plus className="h-6 w-6 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Capture Note</h2>
                  </>
                )}
                <div className="text-sm text-gray-400">
                  {modalEditingNote?.title ? modalEditingNote.title.length : 0} + {modalEditingNote?.content ? modalEditingNote.content.length : 0} characters
                </div>
              </div>
              <button
                onClick={cancelModalEdit}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                title="Close (ESC)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Two Column Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column - Main Content */}
              <div className="flex-1 flex flex-col p-6">
                {/* Title Field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={modalEditingNote?.title || ''}
                    onChange={(e) => modalEditingNote && setModalEditingNote({
                      ...modalEditingNote,
                      title: e.target.value
                    })}
                    placeholder="Note title..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-white text-lg font-medium transition-all"
                    autoFocus
                  />
                </div>

                {/* Category Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={modalEditingNote?.categoryId || ''}
                    onChange={(e) => modalEditingNote && setModalEditingNote({
                      ...modalEditingNote,
                      categoryId: e.target.value
                    })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-white transition-all"
                  >
                    {categories.filter(cat => ['Notes', 'References', 'Media', 'Documents'].includes(cat.name)).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Content Field - Takes up remaining space */}
                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                  <textarea
                    value={modalEditingNote?.content || ''}
                    onChange={(e) => {
                      if (modalEditingNote) {
                        setModalEditingNote({
                          ...modalEditingNote,
                          content: e.target.value
                        });
                      }
                    }}
                    placeholder="Write your note content here... You can write as much as you need!"
                    className="flex-1 w-full px-4 py-4 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-white leading-relaxed transition-all resize-none"
                    style={{ minHeight: '300px' }}
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    {modalEditingNote?.content ? modalEditingNote.content.split(' ').length : 0} words • {modalEditingNote?.content ? modalEditingNote.content.length : 0} characters
                  </div>
                </div>
              </div>

              {/* Right Column - Sidebar for Linked Items */}
              <div className="w-80 border-l border-gray-700 p-6 bg-gray-800/20 overflow-y-auto">
                <h3 className="text-sm font-medium text-gray-300 mb-4">Linked Items</h3>
                
                {/* All linked items display */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2 mb-4 min-h-[2rem] p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
                    {/* Tags */}
                    {modalEditingNote?.tags.map((tag, index) => (
                      <span
                        key={`tag-${index}`}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      >
                        + {tag}
                        <button
                          onClick={() => {
                            if (modalEditingNote) {
                              const updatedTags = modalEditingNote.tags.filter((_, i) => i !== index);
                              setModalEditingNote({
                                ...modalEditingNote,
                                tags: updatedTags
                              });
                            }
                          }}
                          className="ml-1 text-purple-400 hover:text-purple-200 text-sm leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {/* Linked People */}
                    {modalEditingNote?.id && notes.find(n => n.id === modalEditingNote.id)?.linkedPersonIds.map(personId => {
                      const person = people.find(p => p.id === personId);
                      return person ? (
                        <span
                          key={`person-${personId}`}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        >
                          @ {person.name}
                          <button
                            onClick={() => {
                              if (modalEditingNote?.id) {
                                const note = notes.find(n => n.id === modalEditingNote.id);
                                if (note) {
                                  const updatedPersonIds = note.linkedPersonIds.filter(id => id !== personId);
                                  LocalStorage.updateNote(modalEditingNote.id, { linkedPersonIds: updatedPersonIds });
                                  loadData();
                                }
                              }
                            }}
                            className="ml-1 text-blue-400 hover:text-blue-200 text-sm leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}

                    {/* Linked Cases */}
                    {modalEditingNote?.id && notes.find(n => n.id === modalEditingNote.id)?.linkedCaseIds.map(caseId => {
                      const caseItem = cases.find(c => c.id === caseId);
                      return caseItem ? (
                        <span
                          key={`case-${caseId}`}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-500/20 text-green-300 border border-green-500/30"
                        >
                          # {caseItem.name}
                          <button
                            onClick={() => {
                              if (modalEditingNote?.id) {
                                const note = notes.find(n => n.id === modalEditingNote.id);
                                if (note) {
                                  const updatedCaseIds = note.linkedCaseIds.filter(id => id !== caseId);
                                  LocalStorage.updateNote(modalEditingNote.id, { linkedCaseIds: updatedCaseIds });
                                  loadData();
                                }
                              }
                            }}
                            className="ml-1 text-green-400 hover:text-green-200 text-sm leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}

                    {/* Linked Topics */}
                    {modalEditingNote?.id && notes.find(n => n.id === modalEditingNote.id)?.linkedTopicIds.map(topicId => {
                      const topic = topics.find(t => t.id === topicId);
                      return topic ? (
                        <span
                          key={`topic-${topicId}`}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30"
                        >
                          ~ {topic.name}
                          <button
                            onClick={() => {
                              if (modalEditingNote?.id) {
                                const note = notes.find(n => n.id === modalEditingNote.id);
                                if (note) {
                                  const updatedTopicIds = note.linkedTopicIds.filter(id => id !== topicId);
                                  LocalStorage.updateNote(modalEditingNote.id, { linkedTopicIds: updatedTopicIds });
                                  loadData();
                                }
                              }
                            }}
                            className="ml-1 text-orange-400 hover:text-orange-200 text-sm leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                    
                    {/* Empty state message */}
                    {(() => {
                      const hasAnyLinkedItems = (modalEditingNote?.tags.length || 0) > 0 || 
                        (modalEditingNote?.id && (() => {
                          const note = notes.find(n => n.id === modalEditingNote.id);
                          return note && (
                            note.linkedPersonIds.length > 0 || 
                            note.linkedCaseIds.length > 0 || 
                            note.linkedTopicIds.length > 0
                          );
                        })());
                      return !hasAnyLinkedItems && (
                        <span className="text-xs text-gray-500 italic">No linked items yet</span>
                      );
                    })()}
                  </div>
                </div>

                {/* Add Tags */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Add Tags</label>
                  <input
                    type="text"
                    placeholder="Type tag + Enter"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-white text-sm transition-all"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const newTag = input.value.trim();
                        if (newTag && modalEditingNote && !modalEditingNote.tags.includes(newTag)) {
                          setModalEditingNote({
                            ...modalEditingNote,
                            tags: [...modalEditingNote.tags, newTag]
                          });
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>

                {/* Link Existing Items */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-3">Link Existing</label>
                  <div className="space-y-3">
                    <select
                      onChange={(e) => {
                        if (e.target.value && modalEditingNote?.id) {
                          const note = notes.find(n => n.id === modalEditingNote.id);
                          if (note && !note.linkedPersonIds.includes(e.target.value)) {
                            const updatedPersonIds = [...note.linkedPersonIds, e.target.value];
                            LocalStorage.updateNote(modalEditingNote.id, { linkedPersonIds: updatedPersonIds });
                            loadData();
                          }
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-white text-sm"
                    >
                      <option value="">+ Person...</option>
                      {people.map(person => (
                        <option key={person.id} value={person.id}>@ {person.name}</option>
                      ))}
                    </select>

                    <select
                      onChange={(e) => {
                        if (e.target.value && modalEditingNote?.id) {
                          const note = notes.find(n => n.id === modalEditingNote.id);
                          if (note && !note.linkedCaseIds.includes(e.target.value)) {
                            const updatedCaseIds = [...note.linkedCaseIds, e.target.value];
                            LocalStorage.updateNote(modalEditingNote.id, { linkedCaseIds: updatedCaseIds });
                            loadData();
                          }
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-white text-sm"
                    >
                      <option value="">+ Case...</option>
                      {cases.map(caseItem => (
                        <option key={caseItem.id} value={caseItem.id}># {caseItem.name}</option>
                      ))}
                    </select>

                    <select
                      onChange={(e) => {
                        if (e.target.value && modalEditingNote?.id) {
                          const note = notes.find(n => n.id === modalEditingNote.id);
                          if (note && !note.linkedTopicIds.includes(e.target.value)) {
                            const updatedTopicIds = [...note.linkedTopicIds, e.target.value];
                            LocalStorage.updateNote(modalEditingNote.id, { linkedTopicIds: updatedTopicIds });
                            loadData();
                          }
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-white text-sm"
                    >
                      <option value="">+ Topic...</option>
                      {topics.map(topic => (
                        <option key={topic.id} value={topic.id}>~ {topic.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Create New Items */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-3">Quick Create</label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="New person + Enter"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-white text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const personName = input.value.trim();
                          if (personName) {
                            const newPerson = LocalStorage.createPerson({
                              name: personName,
                              email: '',
                              phone: '',
                              role: 'contact'
                            });
                            if (modalEditingNote?.id) {
                              const note = notes.find(n => n.id === modalEditingNote.id);
                              if (note) {
                                const updatedPersonIds = [...note.linkedPersonIds, newPerson.id];
                                LocalStorage.updateNote(modalEditingNote.id, { linkedPersonIds: updatedPersonIds });
                                loadData();
                              }
                            }
                            input.value = '';
                          }
                        }
                      }}
                    />

                    <input
                      type="text"
                      placeholder="New case + Enter"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-white text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const caseName = input.value.trim();
                          if (caseName) {
                            const newCase = LocalStorage.createCase({
                              name: caseName,
                              status: 'Active'
                            });
                            if (modalEditingNote?.id) {
                              const note = notes.find(n => n.id === modalEditingNote.id);
                              if (note) {
                                const updatedCaseIds = [...note.linkedCaseIds, newCase.id];
                                LocalStorage.updateNote(modalEditingNote.id, { linkedCaseIds: updatedCaseIds });
                                loadData();
                              }
                            }
                            input.value = '';
                          }
                        }
                      }}
                    />

                    <input
                      type="text"
                      placeholder="New topic + Enter"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-white text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const topicName = input.value.trim();
                          if (topicName && modalEditingNote) {
                            const newTopic = LocalStorage.createTopic({
                              name: topicName,
                              description: `Created from note: ${modalEditingNote.title}`,
                              color: 'orange'
                            });
                            if (modalEditingNote.id) {
                              const note = notes.find(n => n.id === modalEditingNote.id);
                              if (note) {
                                const updatedTopicIds = [...note.linkedTopicIds, newTopic.id];
                                LocalStorage.updateNote(modalEditingNote.id, { linkedTopicIds: updatedTopicIds });
                                loadData();
                              }
                            }
                            input.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Help Text */}
                <div className="text-xs text-gray-500 bg-gray-800/30 p-3 rounded-lg">
                  <p className="mb-2">💡 <strong>Quick Tips:</strong></p>
                  <p>• Type and press Enter to add items</p>
                  <p>• Click × on any badge to remove</p>
                  <p>• Tags are treated same as linked items</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-800/50">
              <div className="text-sm text-gray-400">
                💡 Pro tip: Use <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+S</kbd> to save, <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">ESC</kbd> to cancel
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={cancelModalEdit}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-all"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={saveModalEdit}
                  className="flex items-center space-x-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all font-medium"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Compact Header with Stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Knowledge Hub
            </h1>
          </div>
          
          {/* Compact Stats with Inbox Alert */}
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <button
                onClick={enterInboxProcessingMode}
                className={`text-2xl font-bold transition-all cursor-pointer hover:scale-105 ${
                  hasAgingNotes 
                    ? 'text-red-400 animate-pulse' 
                    : inboxNotes.length > 0 
                      ? 'text-yellow-400 hover:text-yellow-300' 
                      : 'text-gray-400'
                }`}
              >
                📥 {inboxNotes.length}
              </button>
              <div className="text-xs text-gray-400">
                {hasAgingNotes ? 'Needs Review!' : 'Inbox'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalNotes}</div>
              <div className="text-xs text-gray-400">Total Notes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">+{notesToday}</div>
              <div className="text-xs text-gray-400">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{categories.length}</div>
              <div className="text-xs text-gray-400">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{topics.length}</div>
              <div className="text-xs text-gray-400">Topics</div>
            </div>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={startCapture}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-all font-medium"
          >
            <Plus className="h-5 w-5" />
            <span>Capture</span>
          </button>
          
          <div className="flex-1">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createNote()}
              placeholder="Call with @John re mediation prep #Cullors ~Mediation +followup"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-gray-700 transition-all placeholder-gray-500 text-white note-input"
            />
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your notes..."
              className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-gray-700 transition-all placeholder-gray-500 text-white"
            />
          </div>
        </div>

        {/* View Toggle Buttons & Status Filter */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 bg-gray-900/50 border border-gray-800/50 rounded-xl p-1">
            <button
              onClick={() => setCurrentView('list')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'list' 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span>📋</span>
              <span>List View</span>
            </button>
            <button
              onClick={() => setCurrentView('grid')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'grid' 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span>⊞</span>
              <span>Grid View</span>
            </button>
            <button
              onClick={() => setCurrentView('categories')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'categories' 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span>📁</span>
              <span>Categories</span>
            </button>
            <button
              onClick={() => setCurrentView('topics')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'topics' 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span>🏷️</span>
              <span>Topics</span>
            </button>
            <button
              onClick={() => {
                setCurrentView('ai-insights');
                if (!aiInsights) generateAIInsights();
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'ai-insights' 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span>✨</span>
            </button>
          </div>

          {/* Status Filter - Multi-select */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Filter by status:</span>
            <div className="flex items-center space-x-1 bg-gray-900/50 border border-gray-800/50 rounded-xl p-1">
              {/* All/Clear button */}
              <button
                onClick={() => setStatusFilter(new Set())}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm ${
                  statusFilter.size === 0
                    ? 'bg-purple-500 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span>📋</span>
                <span>All</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  statusFilter.size === 0 ? 'bg-white/20' : 'bg-gray-700'
                }`}>
                  {notes.length}
                </span>
              </button>

              {/* Individual status filters */}
              {(['inbox', 'active', 'done', 'archived'] as const).map((status) => {
                const isActive = statusFilter.has(status);
                const statusStyle = getStatusStyle(status);
                const count = notes.filter(note => note.status === status).length;
                
                return (
                  <button
                    key={status}
                    onClick={() => {
                      const newFilter = new Set(statusFilter);
                      if (isActive) {
                        newFilter.delete(status);
                      } else {
                        newFilter.add(status);
                      }
                      setStatusFilter(newFilter);
                    }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm ${
                      isActive 
                        ? 'bg-purple-500 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <span>{statusStyle.icon}</span>
                    <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20' : 'bg-gray-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inbox Processing Mode - Dedicated Screen */}
        {isInboxProcessingMode && (
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">📥</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">Inbox Processing</h2>
                  <p className="text-gray-400">Process {inboxNotes.length} notes waiting in your inbox</p>
                </div>
              </div>
              <button
                onClick={exitInboxProcessingMode}
                className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-all"
              >
                <X className="h-4 w-4" />
                <span>Exit Processing</span>
              </button>
            </div>

            {/* Processing Progress */}
            <div className="mb-6 p-4 bg-gray-800/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm text-purple-400">
                  {processedNoteIds.size} of {inboxNotes.length} processed
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${inboxNotes.length > 0 ? (processedNoteIds.size / inboxNotes.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Inbox Notes for Processing */}
            <div className="space-y-4">
              {inboxNotes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl mb-4 block">🎉</span>
                  <h3 className="text-lg font-medium mb-2">Inbox is empty!</h3>
                  <p className="text-sm">All notes have been processed.</p>
                </div>
              ) : (
                inboxNotes.map((note) => {
                  const category = categories.find(cat => cat.id === note.categoryId);
                  const linkedTopics = topics.filter(topic => note.linkedTopicIds.includes(topic.id));
                  const linkedPeople = people.filter(person => note.linkedPersonIds.includes(person.id));
                  const linkedCases = cases.filter(caseItem => note.linkedCaseIds.includes(caseItem.id));
                  const isProcessed = processedNoteIds.has(note.id);
                  const ageInDays = getAgeInDays(note.createdAt);

                  return (
                    <div 
                      key={note.id} 
                      className={`border rounded-xl p-4 transition-all ${
                        isProcessed 
                          ? 'bg-green-500/10 border-green-500/30 opacity-75' 
                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className={`mr-2 ${getAgeColor(ageInDays)}`}>
                              {getAgeIcon(ageInDays)}
                            </span>
                            <h3 className="text-lg font-medium text-white">{note.title}</h3>
                            {ageInDays >= 3 && (
                              <span className="ml-2 text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full">
                                {ageInDays} days old
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 flex-wrap gap-2 mb-3">
                            {category && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                {category.icon} {category.name}
                              </span>
                            )}

                            {linkedTopics.map(topic => (
                              <span key={topic.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                ~ {topic.name}
                              </span>
                            ))}

                            {linkedPeople.map(person => (
                              <span key={person.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                @ {person.name}
                              </span>
                            ))}

                            {linkedCases.map(caseItem => (
                              <span key={caseItem.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                                # {caseItem.name}
                              </span>
                            ))}

                            {note.tags.map((tag, tagIndex) => (
                              <span key={`${tag}-${tagIndex}`} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                + {tag}
                              </span>
                            ))}
                          </div>

                          <div className="text-xs text-gray-500">
                            Created: {new Date(note.createdAt).toLocaleDateString()} • {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        
                        {!isProcessed && (
                          <div className="flex items-center space-x-2 ml-4">
                            <button 
                              onClick={() => moveNoteToStatus(note.id, 'active')}
                              className="flex items-center space-x-1 px-3 py-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all border border-blue-500/30"
                            >
                              <span>🔄</span>
                              <span className="text-sm">Active</span>
                            </button>
                            <button 
                              onClick={() => moveNoteToStatus(note.id, 'done')}
                              className="flex items-center space-x-1 px-3 py-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-all border border-green-500/30"
                            >
                              <span>✅</span>
                              <span className="text-sm">Done</span>
                            </button>
                            <button 
                              onClick={() => moveNoteToStatus(note.id, 'archived')}
                              className="flex items-center space-x-1 px-3 py-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all border border-purple-500/30"
                            >
                              <span>📦</span>
                              <span className="text-sm">Archive</span>
                            </button>
                            <button 
                              onClick={() => startEditing(note)}
                              className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Edit Note"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {isProcessed && (
                          <div className="flex items-center space-x-2 ml-4">
                            <span className="text-green-400 text-sm">✓ Processed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Actions */}
            {inboxNotes.length > 0 && (
              <div className="mt-6 flex items-center justify-center space-x-4">
                <button
                  onClick={() => {
                    inboxNotes.forEach(note => moveNoteToStatus(note.id, 'active'));
                  }}
                  className="px-4 py-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all border border-blue-500/30"
                >
                  🔄 Move All to Active
                </button>
                <button
                  onClick={() => {
                    inboxNotes.forEach(note => moveNoteToStatus(note.id, 'archived'));
                  }}
                  className="px-4 py-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all border border-purple-500/30"
                >
                  📦 Archive All
                </button>
              </div>
            )}
          </div>
        )}

        {/* Conditional View Rendering */}
        {!isInboxProcessingMode && currentView === 'ai-insights' && (
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-6 w-6 text-purple-400" />
                <h3 className="text-lg font-medium text-white">AI Knowledge Insights</h3>
              </div>
              <button
                onClick={generateAIInsights}
                disabled={isGeneratingInsights || notes.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-all"
              >
                {isGeneratingInsights ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Generate Insights</span>
                  </>
                )}
              </button>
            </div>

            {aiInsights ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Patterns */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    <h4 className="font-medium text-blue-400">Patterns Detected</h4>
                  </div>
                  {aiInsights.patterns.length > 0 ? (
                    <ul className="space-y-2">
                      {aiInsights.patterns.map((pattern, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start space-x-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No patterns detected yet.</p>
                  )}
                </div>

                {/* Recommendations */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb className="h-5 w-5 text-yellow-400" />
                    <h4 className="font-medium text-yellow-400">Recommendations</h4>
                  </div>
                  {aiInsights.recommendations.length > 0 ? (
                    <ul className="space-y-2">
                      {aiInsights.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start space-x-2">
                          <span className="text-yellow-400 mt-1">💡</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No recommendations available.</p>
                  )}
                </div>

                {/* Cross References */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Link className="h-5 w-5 text-green-400" />
                    <h4 className="font-medium text-green-400">Connections</h4>
                  </div>
                  {aiInsights.crossReferences.length > 0 ? (
                    <div className="space-y-2">
                      {aiInsights.crossReferences.slice(0, 3).map((ref, index) => {
                        const note1 = notes.find(n => n.id === ref.noteId1);
                        const note2 = notes.find(n => n.id === ref.noteId2);
                        return (
                          <div key={index} className="text-sm">
                            <div className="text-gray-300 mb-1">{ref.connection}</div>
                            <div className="text-xs text-gray-500">
                              {note1?.title.substring(0, 30)}... ↔ {note2?.title.substring(0, 30)}...
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No connections found.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p>Generate AI insights to discover patterns, get recommendations, and find connections in your knowledge base.</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {categories.filter(cat => ['Notes', 'References', 'Media', 'Documents'].includes(cat.name)).map((category) => {
              const categoryNotes = filteredNotes.filter(note => note.categoryId === category.id);
              return (
                <div 
                  key={category.id} 
                  className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedCategoryForModal(category);
                    setIsCategoryModalOpen(true);
                  }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">{category.name}</h3>
                      <p className="text-sm text-gray-400">{categoryNotes.length} notes</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-purple-400">→</span>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categoryNotes.slice(0, 5).map((note) => {
                      const linkedTopics = topics.filter(topic => note.linkedTopicIds.includes(topic.id));
                      const linkedPeople = people.filter(person => note.linkedPersonIds.includes(person.id));
                      const linkedCases = cases.filter(caseItem => note.linkedCaseIds.includes(caseItem.id));
                      
                      return (
                        <div key={note.id} className="p-2 bg-gray-800/30 rounded-lg">
                          <p className="text-sm text-gray-300 truncate">{note.title}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {linkedTopics.map(topic => (
                                <span key={topic.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                  ~ {topic.name}
                                </span>
                              ))}

                              {linkedPeople.map(person => (
                                <span key={person.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  @ {person.name}
                                </span>
                              ))}

                              {linkedCases.map(caseItem => (
                                <span key={caseItem.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                                  # {caseItem.name}
                                </span>
                              ))}

                              {note.tags.map((tag, tagIndex) => (
                                <span key={`${tag}-${tagIndex}`} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                  + {tag}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 ml-2 flex-shrink-0">{new Date(note.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    {categoryNotes.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">+{categoryNotes.length - 5} more notes</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentView === 'topics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {topics.map((topic) => {
              const topicNotes = filteredNotes.filter(note => note.linkedTopicIds.includes(topic.id));
              return (
                <div 
                  key={topic.id} 
                  className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedTopicForModal(topic);
                    setIsTopicModalOpen(true);
                  }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">🏷️</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-white group-hover:text-orange-400 transition-colors">{topic.name}</h3>
                      <p className="text-sm text-gray-400">{topicNotes.length} notes</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-orange-400">→</span>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {topicNotes.slice(0, 5).map((note) => {
                      const noteCategory = categories.find(cat => cat.id === note.categoryId);
                      const linkedTopics = topics.filter(t => note.linkedTopicIds.includes(t.id));
                      const linkedPeople = people.filter(person => note.linkedPersonIds.includes(person.id));
                      const linkedCases = cases.filter(caseItem => note.linkedCaseIds.includes(caseItem.id));
                      
                      return (
                        <div key={note.id} className="p-2 bg-gray-800/30 rounded-lg">
                          <p className="text-sm text-gray-300 truncate">{note.title}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {noteCategory && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                  {noteCategory.icon} {noteCategory.name}
                                </span>
                              )}
                              
                              {linkedTopics.filter(t => selectedTopicForModal && t.id !== selectedTopicForModal.id).map(t => (
                                <span key={t.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                  ~ {t.name}
                                </span>
                              ))}

                              {linkedPeople.map(person => (
                                <span key={person.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  @ {person.name}
                                </span>
                              ))}

                              {linkedCases.map(caseItem => (
                                <span key={caseItem.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                                  # {caseItem.name}
                                </span>
                              ))}

                              {note.tags.map((tag, tagIndex) => (
                                <span key={`${tag}-${tagIndex}`} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                  + {tag}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 ml-2 flex-shrink-0">{new Date(note.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    {topicNotes.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">+{topicNotes.length - 5} more notes</p>
                    )}
                  </div>
                </div>
              );
            })}
            {topics.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <span className="text-4xl mb-4 block">🏷️</span>
                <h3 className="text-lg font-medium mb-2">No topics yet</h3>
                <p className="text-sm">Topics will appear here when you create notes with ~topic syntax</p>
              </div>
            )}
          </div>
        )}

        {(currentView === 'list' || currentView === 'grid') && (
          <div>
            {filteredNotes.length === 0 && searchQuery && (
              <div className="text-center py-12 text-gray-500">
                No notes found matching "{searchQuery}"
              </div>
            )}
            
            {filteredNotes.length === 0 && !searchQuery && (
              <div className="text-center py-12 text-gray-500">
                No notes yet. Create your first note above.
              </div>
            )}

            {currentView === 'grid' ? (
              /* Grid View - Compact Layout */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredNotes.map((note) => {
                  const category = categories.find(cat => cat.id === note.categoryId);
                  const linkedTopics = topics.filter(topic => note.linkedTopicIds.includes(topic.id));
                  const linkedPeople = people.filter(person => note.linkedPersonIds.includes(person.id));
                  const linkedCases = cases.filter(caseItem => note.linkedCaseIds.includes(caseItem.id));

                  return (
                    <div 
                      key={note.id} 
                      className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 transition-all group min-h-[200px] flex flex-col cursor-pointer"
                      onClick={() => startEditing(note)}
                    >
                      {/* Header */}
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 leading-tight">{note.title}</h3>
                        {category && (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              cycleCategoryForNote(note.id);
                            }}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 cursor-pointer hover:bg-purple-500/30 transition-all group/category"
                            title="Click to cycle category"
                          >
                            {category.icon} {category.name}
                            <span className="ml-1 opacity-0 group-hover/category:opacity-100 transition-opacity text-xs">↻</span>
                          </span>
                        )}
                      </div>

                      {/* Content Section - Compact badges like list view */}
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-1 mb-3">
                          {linkedTopics.map(topic => (
                            editingTopic?.noteId === note.id && editingTopic?.topicId === topic.id ? (
                              <input
                                key={topic.id}
                                type="text"
                                value={editingTopicValue}
                                onChange={(e) => setEditingTopicValue(e.target.value)}
                                onKeyDown={handleTopicKeyDown}
                                onBlur={saveEditingTopic}
                                className="px-2 py-1 rounded-md text-xs bg-orange-500/40 text-orange-200 border border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                style={{ width: `${Math.max(editingTopicValue.length * 8, 60)}px` }}
                                autoFocus
                              />
                            ) : (
                              <span 
                                key={topic.id} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingTopic(note.id, topic.id, topic.name);
                                }}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-500/20 text-orange-400 cursor-pointer hover:bg-orange-500/30 transition-all"
                                title="Click to edit topic"
                              >
                                ~ {topic.name}
                              </span>
                            )
                          ))}

                          {linkedPeople.map(person => (
                            editingPerson?.noteId === note.id && editingPerson?.personId === person.id ? (
                              <input
                                key={person.id}
                                type="text"
                                value={editingPersonValue}
                                onChange={(e) => setEditingPersonValue(e.target.value)}
                                onKeyDown={handlePersonKeyDown}
                                onBlur={saveEditingPerson}
                                className="px-2 py-1 rounded-md text-xs bg-blue-500/40 text-blue-200 border border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                style={{ width: `${Math.max(editingPersonValue.length * 8, 60)}px` }}
                                autoFocus
                              />
                            ) : (
                              <span 
                                key={person.id} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingPerson(note.id, person.id, person.name);
                                }}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-500/20 text-blue-400 cursor-pointer hover:bg-blue-500/30 transition-all"
                                title="Click to edit person"
                              >
                                @ {person.name}
                              </span>
                            )
                          ))}

                          {linkedCases.map(caseItem => (
                            editingCase?.noteId === note.id && editingCase?.caseId === caseItem.id ? (
                              <input
                                key={caseItem.id}
                                type="text"
                                value={editingCaseValue}
                                onChange={(e) => setEditingCaseValue(e.target.value)}
                                onKeyDown={handleCaseKeyDown}
                                onBlur={saveEditingCase}
                                className="px-2 py-1 rounded-md text-xs bg-green-500/40 text-green-200 border border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-400"
                                style={{ width: `${Math.max(editingCaseValue.length * 8, 60)}px` }}
                                autoFocus
                              />
                            ) : (
                              <span 
                                key={caseItem.id} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingCase(note.id, caseItem.id, caseItem.name);
                                }}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-500/20 text-green-400 cursor-pointer hover:bg-green-500/30 transition-all"
                                title="Click to edit case"
                              >
                                # {caseItem.name}
                              </span>
                            )
                          ))}

                          {note.tags.map((tag, tagIndex) => (
                            editingTag?.noteId === note.id && editingTag?.tagIndex === tagIndex ? (
                              <input
                                key={`${tag}-${tagIndex}`}
                                type="text"
                                value={editingTagValue}
                                onChange={(e) => setEditingTagValue(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                onBlur={saveEditingTag}
                                className="px-2 py-1 rounded-md text-xs bg-yellow-500/40 text-yellow-200 border border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                                style={{ width: `${Math.max(editingTagValue.length * 8, 60)}px` }}
                                autoFocus
                              />
                            ) : (
                              <span 
                                key={`${tag}-${tagIndex}`} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingTag(note.id, tagIndex, tag);
                                }}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-500/20 text-yellow-400 cursor-pointer hover:bg-yellow-500/30 transition-all"
                                title="Click to edit tag"
                              >
                                + {tag}
                              </span>
                            )
                          ))}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800/50">
                        <span className="text-xs text-gray-500">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (noteAnalysis[note.id]) {
                                // If analysis exists, toggle showing/hiding
                                setShowingAIAnalysis(showingAIAnalysis === note.id ? null : note.id);
                              } else {
                                // If no analysis exists, generate it
                                const contentForAnalysis = note.content.trim() ? 
                                  note.title + ' ' + note.content : 
                                  note.title;
                                analyzeNoteManually(note.id, contentForAnalysis);
                              }
                            }}
                            className="p-2 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title={noteAnalysis[note.id] ? "Toggle AI Analysis" : "Analyze with AI"}
                            disabled={isAnalyzingNote === note.id}
                          >
                            {isAnalyzingNote === note.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(note);
                            }}
                            className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit Note"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNote(note.id);
                            }}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Note"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* AI Analysis Display */}
                      {noteAnalysis[note.id] && showingAIAnalysis === note.id && (
                        <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-purple-400 flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              AI Analysis
                            </span>
                            <button
                              onClick={() => setShowingAIAnalysis(null)}
                              className="text-gray-400 hover:text-white text-sm"
                            >
                              ✕
                            </button>
                          </div>
                          
                          {noteAnalysis[note.id].summary && (
                            <p className="text-sm text-gray-300 mb-3 line-clamp-3">{noteAnalysis[note.id].summary}</p>
                          )}
                          
                          {noteAnalysis[note.id].keyTopics.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {noteAnalysis[note.id].keyTopics.slice(0, 3).map((topic, index) => (
                                <span key={index} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View - With AI Analysis Display Added */
              <div className="space-y-4">
                {filteredNotes.map((note) => {
                  const category = categories.find(cat => cat.id === note.categoryId);
                  const linkedTopics = topics.filter(topic => note.linkedTopicIds.includes(topic.id));
                  const linkedPeople = people.filter(person => note.linkedPersonIds.includes(person.id));
                  const linkedCases = cases.filter(caseItem => note.linkedCaseIds.includes(caseItem.id));

                  return (
                    <div key={note.id} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 transition-all group cursor-pointer" onClick={() => startEditing(note)}>
                      {editingNoteId === note.id ? (
                        /* Editing Mode */
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                            <input
                              type="text"
                              value={editingNote.title}
                              onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-gray-600 text-white"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                            <textarea
                              value={editingNote.content}
                              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-gray-600 text-white"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={cancelEdit}
                              className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
                            >
                              <X className="h-4 w-4" />
                              <span>Cancel</span>
                            </button>
                            <button
                              onClick={saveEdit}
                              className="flex items-center space-x-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all"
                            >
                              <Save className="h-4 w-4" />
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display Mode */
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <h3 className="text-lg font-medium text-white mr-2">{note.title}</h3>
                                
                                {/* Inbox Processing Action Buttons - Right after title */}
                                {note.status === 'inbox' && (
                                  <div className="flex items-center space-x-1 ml-2">
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        moveNoteToStatus(note.id, 'active');
                                      }}
                                      className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-all text-sm"
                                      title="Move to Active"
                                    >
                                      🔄
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        moveNoteToStatus(note.id, 'done');
                                      }}
                                      className="p-1 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded transition-all text-sm"
                                      title="Mark as Done"
                                    >
                                      ✅
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        moveNoteToStatus(note.id, 'archived');
                                      }}
                                      className="p-1 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-all text-sm"
                                      title="Archive"
                                    >
                                      📦
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-2 flex-wrap gap-2">
                                  {category && (
                                    <span 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cycleCategoryForNote(note.id);
                                      }}
                                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 cursor-pointer hover:bg-purple-500/30 transition-all group/category"
                                      title="Click to cycle category"
                                    >
                                      {category.icon} {category.name}
                                      <span className="ml-1 opacity-0 group-hover/category:opacity-100 transition-opacity text-xs">↻</span>
                                    </span>
                                  )}

                                  {linkedTopics.map(topic => (
                                    editingTopic?.noteId === note.id && editingTopic?.topicId === topic.id ? (
                                      <input
                                        key={topic.id}
                                        type="text"
                                        value={editingTopicValue}
                                        onChange={(e) => setEditingTopicValue(e.target.value)}
                                        onKeyDown={handleTopicKeyDown}
                                        onBlur={saveEditingTopic}
                                        className="px-2 py-1 rounded-md text-xs bg-orange-500/40 text-orange-200 border border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                        style={{ width: `${Math.max(editingTopicValue.length * 8, 60)}px` }}
                                        autoFocus
                                      />
                                    ) : (
                                      <span 
                                        key={topic.id} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditingTopic(note.id, topic.id, topic.name);
                                        }}
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 cursor-pointer hover:bg-orange-500/30 transition-all"
                                        title="Click to edit topic"
                                      >
                                        ~ {topic.name}
                                      </span>
                                    )
                                  ))}

                                  {linkedPeople.map(person => (
                                    editingPerson?.noteId === note.id && editingPerson?.personId === person.id ? (
                                      <input
                                        key={person.id}
                                        type="text"
                                        value={editingPersonValue}
                                        onChange={(e) => setEditingPersonValue(e.target.value)}
                                        onKeyDown={handlePersonKeyDown}
                                        onBlur={saveEditingPerson}
                                        className="px-2 py-1 rounded-md text-xs bg-blue-500/40 text-blue-200 border border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        style={{ width: `${Math.max(editingPersonValue.length * 8, 60)}px` }}
                                        autoFocus
                                      />
                                    ) : (
                                      <span 
                                        key={person.id} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditingPerson(note.id, person.id, person.name);
                                        }}
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-pointer hover:bg-blue-500/30 transition-all"
                                        title="Click to edit person"
                                      >
                                        @ {person.name}
                                      </span>
                                    )
                                  ))}

                                  {linkedCases.map(caseItem => (
                                    editingCase?.noteId === note.id && editingCase?.caseId === caseItem.id ? (
                                      <input
                                        key={caseItem.id}
                                        type="text"
                                        value={editingCaseValue}
                                        onChange={(e) => setEditingCaseValue(e.target.value)}
                                        onKeyDown={handleCaseKeyDown}
                                        onBlur={saveEditingCase}
                                        className="px-2 py-1 rounded-md text-xs bg-green-500/40 text-green-200 border border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-400"
                                        style={{ width: `${Math.max(editingCaseValue.length * 8, 60)}px` }}
                                        autoFocus
                                      />
                                    ) : (
                                      <span 
                                        key={caseItem.id} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditingCase(note.id, caseItem.id, caseItem.name);
                                        }}
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-500/20 text-green-400 border border-green-500/30 cursor-pointer hover:bg-green-500/30 transition-all"
                                        title="Click to edit case"
                                      >
                                        # {caseItem.name}
                                      </span>
                                    )
                                  ))}

                                  {note.tags.map((tag, tagIndex) => (
                                    editingTag?.noteId === note.id && editingTag?.tagIndex === tagIndex ? (
                                      <input
                                        key={`${tag}-${tagIndex}`}
                                        type="text"
                                        value={editingTagValue}
                                        onChange={(e) => setEditingTagValue(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        onBlur={saveEditingTag}
                                        className="px-2 py-1 rounded-md text-xs bg-yellow-500/40 text-yellow-200 border border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                                        style={{ width: `${Math.max(editingTagValue.length * 8, 60)}px` }}
                                        autoFocus
                                      />
                                    ) : (
                                      <span 
                                        key={`${tag}-${tagIndex}`} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditingTag(note.id, tagIndex, tag);
                                        }}
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 cursor-pointer hover:bg-yellow-500/30 transition-all"
                                        title="Click to edit tag"
                                      >
                                        + {tag}
                                      </span>
                                    )
                                  ))}
                                </div>
                                
                                <span className="text-xs text-gray-500 flex-shrink-0 ml-4">
                                  {new Date(note.updatedAt).toLocaleDateString()} • {new Date(note.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (noteAnalysis[note.id]) {
                                    // If analysis exists, toggle showing/hiding
                                    setShowingAIAnalysis(showingAIAnalysis === note.id ? null : note.id);
                                  } else {
                                    // If no analysis exists, generate it
                                    const contentForAnalysis = note.content.trim() ? 
                                      note.title + ' ' + note.content : 
                                      note.title;
                                    analyzeNoteManually(note.id, contentForAnalysis);
                                  }
                                }}
                                className="p-2 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                                title={noteAnalysis[note.id] ? "Toggle AI Analysis" : "Analyze with AI"}
                                disabled={isAnalyzingNote === note.id}
                              >
                                {isAnalyzingNote === note.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
                                ) : (
                                  <Sparkles className="h-4 w-4" />
                                )}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  startEditing(note);
                                }}
                                className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                title="Edit Note"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteNote(note.id);
                                }}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Delete Note"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* AI Analysis Display - NOW ADDED TO LIST VIEW */}
                          {noteAnalysis[note.id] && showingAIAnalysis === note.id && (
                            <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-purple-400 flex items-center gap-2">
                                  <Sparkles className="h-4 w-4" />
                                  AI Analysis
                                </span>
                                <button
                                  onClick={() => setShowingAIAnalysis(null)}
                                  className="text-gray-400 hover:text-white text-sm"
                                >
                                  ✕
                                </button>
                              </div>
                              
                              {noteAnalysis[note.id].summary && (
                                <p className="text-sm text-gray-300 mb-3">{noteAnalysis[note.id].summary}</p>
                              )}
                              
                              {noteAnalysis[note.id].keyTopics.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-gray-500 mb-2">Key Topics:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {noteAnalysis[note.id].keyTopics.map((topic, index) => (
                                      <span key={index} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                                        {topic}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {noteAnalysis[note.id].insights.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-2">Insights:</p>
                                  <ul className="space-y-1">
                                    {noteAnalysis[note.id].insights.map((insight, index) => (
                                      <li key={index} className="text-xs text-gray-400 flex items-start gap-2">
                                        <span className="text-purple-400 mt-1">•</span>
                                        <span>{insight}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
