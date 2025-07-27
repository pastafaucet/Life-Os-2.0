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

  useEffect(() => {
    LocalStorage.initialize();
    loadData();
    setInitialized(true);
  }, []);

  // Keyboard shortcut: Ctrl+K to create new note
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
    };

    // Add event listener to document instead of window
    document.addEventListener('keydown', handleKeyDown, true);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

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
        categoryId: selectedCategory || (categories.find(cat => cat.name === 'General')?.id || 'general'),
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
      let detectedCategory = categories.find(cat => cat.name === 'General')?.id || 'general';
      
      if (content.includes('meeting') || content.includes('call') || content.includes('discussed')) {
        detectedCategory = categories.find(cat => cat.name === 'Meeting Notes')?.id || detectedCategory;
      } else if (content.includes('case') || content.includes('client') || content.includes('legal')) {
        detectedCategory = categories.find(cat => cat.name === 'Case Notes')?.id || detectedCategory;
      } else if (content.includes('article') || content.includes('link') || content.includes('http')) {
        detectedCategory = categories.find(cat => cat.name === 'Articles')?.id || detectedCategory;
      } else if (content.includes('idea') || content.includes('think') || content.includes('consider')) {
        detectedCategory = categories.find(cat => cat.name === 'Ideas')?.id || detectedCategory;
      }
      
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

      // Analyze the note with AI if it has meaningful content
      if (cleanTitle.trim().length > 10) {
        try {
          setIsAnalyzingNote(createdNote.id);
          const analysis = await analyzeNote(cleanTitle);
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
      
      setNewNote('');
    }
    
    loadData();
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

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingNote({ title: note.title, content: note.content });
  };

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
    ((notes.filter(note => note.categoryId !== 'general').length / Math.max(totalNotes, 1)) * 40) +
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
    
    // Status filter
    if (filterStatus && note.status !== filterStatus) {
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
      
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Brain className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Knowledge Hub
            </h1>
          </div>
          <p className="text-gray-400">
            Your personal knowledge management system • {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {knowledgeStats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 transition-all hover:transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <div className={`text-xs flex items-center gap-1 ${
                    stat.changeType === 'positive' ? 'text-green-400' : 
                    stat.changeType === 'negative' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {stat.changeType === 'positive' && <span>↑</span>}
                    {stat.changeType === 'negative' && <span>↓</span>}
                    {stat.changeType === 'neutral' && <span>→</span>}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center text-lg`}>
                  {stat.emoji}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Note Creation */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 mb-6">
          {!showAdvancedForm ? (
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createNote()}
                placeholder="Capture a thought, idea, or note... (auto-detects category)"
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-lg note-input"
              />
              
              {/* Keyword Hints */}
              <div className="flex flex-col text-xs text-gray-500 space-y-1 min-w-[120px] border-l border-gray-700 pl-4">
                <div className="font-medium text-gray-400 mb-1">Keywords:</div>
                <div>📋 meeting, call</div>
                <div>⚖️ case, client</div>
                <div>📰 article, link</div>
                <div>💡 idea, think</div>
              </div>
              
              {/* Symbols Reference */}
              <div className="flex flex-col text-xs text-gray-500 space-y-1 min-w-[100px] border-l border-gray-700 pl-4">
                <div className="font-medium text-gray-400 mb-1">Symbols:</div>
                <div>` Categories</div>
                <div>~ Topics</div>
                <div>@ People</div>
                <div># Cases</div>
                <div>+ Tags</div>
              </div>
              
              <button
                onClick={() => setShowAdvancedForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-all text-gray-300"
              >
                <Edit3 className="h-4 w-4" />
                <span>Advanced</span>
              </button>
              <button
                onClick={createNote}
                disabled={!newNote.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Note</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Create Enhanced Note</h3>
                <button
                  onClick={() => setShowAdvancedForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-gray-600 text-white"
                  >
                    <option value="">Select category...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Note content..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300"
                    >
                      {tag}
                      <button
                        onClick={() => removeFormTag(tag)}
                        className="ml-1 text-purple-400 hover:text-purple-200"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-gray-600 text-white"
                  />
                  <button
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 rounded-lg transition-all text-white"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAdvancedForm(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-all text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={createNote}
                  disabled={!noteTitle.trim() || !noteContent.trim()}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-all text-white"
                >
                  Create Note
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Toggle Buttons */}
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

          {/* Search - moved to the right */}
          <div className="relative flex-1 max-w-md ml-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your notes..."
              className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-gray-700 transition-all placeholder-gray-500"
            />
          </div>
        </div>

        {/* Conditional View Rendering */}
        {currentView === 'ai-insights' && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {categories.map((category) => {
              const categoryNotes = filteredNotes.filter(note => note.categoryId === category.id);
              return (
                <div key={category.id} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 transition-all">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="font-medium text-white">{category.name}</h3>
                      <p className="text-sm text-gray-400">{categoryNotes.length} notes</p>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categoryNotes.slice(0, 5).map((note) => (
                      <div key={note.id} className="p-2 bg-gray-800/30 rounded-lg">
                        <p className="text-sm text-gray-300 truncate">{note.title}</p>
                        <p className="text-xs text-gray-500">{new Date(note.updatedAt).toLocaleDateString()}</p>
                      </div>
                    ))}
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
                <div key={topic.id} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 transition-all">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">🏷️</span>
                    <div>
                      <h3 className="font-medium text-white">{topic.name}</h3>
                      <p className="text-sm text-gray-400">{topicNotes.length} notes</p>
                    </div>
                  </div>
                  {topic.description && (
                    <p className="text-sm text-gray-500 mb-3">{topic.description}</p>
                  )}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {topicNotes.slice(0, 5).map((note) => (
                      <div key={note.id} className="p-2 bg-gray-800/30 rounded-lg">
                        <p className="text-sm text-gray-300 truncate">{note.title}</p>
                        <p className="text-xs text-gray-500">{new Date(note.updatedAt).toLocaleDateString()}</p>
                      </div>
                    ))}
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
                      onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                    >
                      {/* Header */}
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 leading-tight">{note.title}</h3>
                        {category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {category.icon} {category.name}
                          </span>
                        )}
                      </div>

                      {/* Content Section - Compact badges like list view */}
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-1 mb-3">
                          {linkedTopics.map(topic => (
                            <span key={topic.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-500/20 text-orange-400">
                              ~ {topic.name}
                            </span>
                          ))}

                          {linkedPeople.map(person => (
                            <span key={person.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-500/20 text-blue-400">
                              @ {person.name}
                            </span>
                          ))}

                          {linkedCases.map(caseItem => (
                            <span key={caseItem.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-500/20 text-green-400">
                              # {caseItem.name}
                            </span>
                          ))}

                          {note.tags.map((tag, tagIndex) => (
                            <span key={`${tag}-${tagIndex}`} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-500/20 text-yellow-400">
                              + {tag}
                            </span>
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
                    <div key={note.id} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 transition-all group">
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
                                <h3 className="text-lg font-medium text-white mr-4">{note.title}</h3>
                              </div>

                              <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-2 flex-wrap gap-2">
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
                                
                                <span className="text-xs text-gray-500 flex-shrink-0 ml-4">
                                  {new Date(note.updatedAt).toLocaleDateString()} • {new Date(note.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
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
                                onClick={() => startEditing(note)}
                                className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => deleteNote(note.id)}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
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
