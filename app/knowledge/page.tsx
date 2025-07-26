'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { LocalStorage } from '../../lib/storage/localStorage';
import { Note, Category, Topic } from '../../lib/storage/types';
import { Brain, Plus, Search, Edit3, Trash2, Target, TrendingUp, Folder, Link, Save, X } from 'lucide-react';

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

  const createNote = () => {
    if (showAdvancedForm) {
      if (!noteTitle.trim() || !noteContent.trim()) return;
      
      LocalStorage.createNote({
        title: noteTitle,
        content: noteContent,
        categoryId: selectedCategory || (categories.find(cat => cat.name === 'General')?.id || 'general'),
        linkedTopicIds: [],
        linkedCaseIds: linkedCases,
        linkedPersonIds: linkedPeople,
        tags: tags
      });
      
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
      
      LocalStorage.createNote({
        title: cleanTitle.length > 50 ? cleanTitle.substring(0, 50) + '...' : cleanTitle,
        content: '', // Content should be empty after parsing symbols
        categoryId: detectedCategory,
        linkedTopicIds: linkedTopicIds,
        linkedCaseIds: linkedCaseIds,
        linkedPersonIds: linkedPersonIds,
        tags: parsed.tags
      });
      
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

        {/* Quick Actions */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-8">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 hover:bg-gray-800/50 transition-all cursor-pointer text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📝</div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300">Quick Note</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 hover:bg-gray-800/50 transition-all cursor-pointer text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📋</div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300">Meeting Notes</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 hover:bg-gray-800/50 transition-all cursor-pointer text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">⚖️</div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300">Case Note</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 hover:bg-gray-800/50 transition-all cursor-pointer text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📰</div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300">Article Save</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 hover:bg-gray-800/50 transition-all cursor-pointer text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔗</div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300">Link to Case</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 hover:bg-gray-800/50 transition-all cursor-pointer text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">👤</div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300">Link to Person</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 hover:bg-gray-800/50 transition-all cursor-pointer text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📁</div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300">Add Category</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 hover:bg-gray-800/50 transition-all cursor-pointer text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🤖</div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300">AI Insight</div>
          </div>
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

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your notes..."
            className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-gray-700 transition-all placeholder-gray-500"
          />
        </div>

        {/* Notes List */}
        <div className="space-y-4">
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
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Line 1: Title with hover category change buttons */}
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-white mr-4">{note.title}</h3>
                        
                        {/* Category Change Buttons (on hover) */}
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {categories
                            .filter(cat => cat.id !== note.categoryId)
                            .slice(0, 4) // Show max 4 buttons
                            .map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                const updatedNote = { ...note, categoryId: cat.id, updatedAt: new Date().toISOString() };
                                setNotes(notes.map(n => n.id === note.id ? updatedNote : n));
                                LocalStorage.updateNote(note.id, { categoryId: cat.id });
                              }}
                              className="px-2 py-1 text-xs rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-all"
                            >
                              📁 {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Line 2: Metadata badges */}
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        {/* Category Badge */}
                        {category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            ` {category.name}
                          </span>
                        )}

                        {/* Topic Badges */}
                        {linkedTopics.map(topic => (
                          <span key={topic.id}>
                            {editingTopic?.topicId === topic.id ? (
                              /* Inline editing mode */
                              <input
                                type="text"
                                value={editingTopicValue}
                                onChange={(e) => setEditingTopicValue(e.target.value)}
                                onKeyDown={handleTopicKeyDown}
                                onBlur={(e) => {
                                  setTimeout(() => saveEditingTopic(), 100);
                                }}
                                autoFocus
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-500/40 text-orange-100 border border-orange-400 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400 outline-none min-w-[60px] max-w-[120px]"
                                style={{ width: `${Math.max(60, editingTopicValue.length * 8 + 20)}px` }}
                              />
                            ) : (
                              /* Display mode */
                              <span 
                                onClick={(e) => {
                                  console.log('Topic clicked:', topic.name, 'topicId:', topic.id);
                                  e.stopPropagation();
                                  e.preventDefault();
                                  startEditingTopic(note.id, topic.id, topic.name);
                                }}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 cursor-pointer hover:bg-orange-500/30 transition-all"
                                title="Click to edit topic"
                              >
                                ~ {topic.name}
                              </span>
                            )}
                          </span>
                        ))}

                        {/* People Badges */}
                        {linkedPeople.map(person => (
                          <span key={person.id}>
                            {editingPerson?.personId === person.id ? (
                              /* Inline editing mode */
                              <input
                                type="text"
                                value={editingPersonValue}
                                onChange={(e) => setEditingPersonValue(e.target.value)}
                                onKeyDown={handlePersonKeyDown}
                                onBlur={(e) => {
                                  setTimeout(() => saveEditingPerson(), 100);
                                }}
                                autoFocus
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-500/40 text-blue-100 border border-blue-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 outline-none min-w-[60px] max-w-[120px]"
                                style={{ width: `${Math.max(60, editingPersonValue.length * 8 + 20)}px` }}
                              />
                            ) : (
                              /* Display mode */
                              <span 
                                onClick={(e) => {
                                  console.log('Person clicked:', person.name, 'personId:', person.id);
                                  e.stopPropagation();
                                  e.preventDefault();
                                  startEditingPerson(note.id, person.id, person.name);
                                }}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-pointer hover:bg-blue-500/30 transition-all"
                                title="Click to edit person"
                              >
                                @ {person.name}
                              </span>
                            )}
                          </span>
                        ))}

                        {/* Case Badges */}
                        {linkedCases.map(caseItem => (
                          <span key={caseItem.id}>
                            {editingCase?.caseId === caseItem.id ? (
                              /* Inline editing mode */
                              <input
                                type="text"
                                value={editingCaseValue}
                                onChange={(e) => setEditingCaseValue(e.target.value)}
                                onKeyDown={handleCaseKeyDown}
                                onBlur={(e) => {
                                  setTimeout(() => saveEditingCase(), 100);
                                }}
                                autoFocus
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-500/40 text-green-100 border border-green-400 focus:ring-2 focus:ring-green-500/50 focus:border-green-400 outline-none min-w-[60px] max-w-[120px]"
                                style={{ width: `${Math.max(60, editingCaseValue.length * 8 + 20)}px` }}
                              />
                            ) : (
                              /* Display mode */
                              <span 
                                onClick={(e) => {
                                  console.log('Case clicked:', caseItem.name, 'caseId:', caseItem.id);
                                  e.stopPropagation();
                                  e.preventDefault();
                                  startEditingCase(note.id, caseItem.id, caseItem.name);
                                }}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-500/20 text-green-400 border border-green-500/30 cursor-pointer hover:bg-green-500/30 transition-all"
                                title="Click to edit case"
                              >
                                # {caseItem.name}
                              </span>
                            )}
                          </span>
                        ))}

                        {/* Tag Badges */}
                        {note.tags.map((tag, tagIndex) => (
                          <span key={`${tag}-${tagIndex}`}>
                            {editingTag?.noteId === note.id && editingTag?.tagIndex === tagIndex ? (
                              /* Inline editing mode */
                              <input
                                type="text"
                                value={editingTagValue}
                                onChange={(e) => setEditingTagValue(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                onBlur={(e) => {
                                  // Only save if we're not clicking on another interactive element
                                  setTimeout(() => saveEditingTag(), 100);
                                }}
                                autoFocus
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-500/40 text-yellow-100 border border-yellow-400 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400 outline-none min-w-[60px] max-w-[120px]"
                                style={{ width: `${Math.max(60, editingTagValue.length * 8 + 20)}px` }}
                              />
                            ) : (
                              /* Display mode */
                              <span 
                                onClick={(e) => {
                                  console.log('Tag clicked:', tag, 'noteId:', note.id, 'tagIndex:', tagIndex);
                                  e.stopPropagation();
                                  e.preventDefault();
                                  startEditingTag(note.id, tagIndex, tag);
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  if (confirm(`Remove tag "${tag}"?`)) {
                                    removeTag(note.id, tag);
                                  }
                                }}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 cursor-pointer hover:bg-yellow-500/30 transition-all"
                                title="Click to edit, right-click to remove"
                              >
                                + {tag}
                              </span>
                            )}
                          </span>
                        ))}

                        {/* Add New Tag Button/Input */}
                        {addingTagToNote === note.id ? (
                          <input
                            type="text"
                            value={newTagValue}
                            onChange={(e) => setNewTagValue(e.target.value)}
                            onKeyDown={handleNewTagKeyDown}
                            onBlur={(e) => {
                              // Only save if we're not clicking on another interactive element
                              setTimeout(() => saveNewTag(), 100);
                            }}
                            placeholder="tag name"
                            autoFocus
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-700/50 text-gray-200 border border-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:border-gray-500 outline-none min-w-[80px] max-w-[120px]"
                            style={{ width: `${Math.max(80, newTagValue.length * 8 + 20)}px` }}
                          />
                        ) : (
                          <button
                            onClick={() => startAddingTag(note.id)}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-700/30 text-gray-500 border border-gray-600/50 hover:bg-gray-600/30 hover:text-gray-400 hover:border-gray-500/50 transition-all cursor-pointer"
                            title="Add new tag"
                          >
                            + add tag
                          </button>
                        )}

                        {/* Date */}
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(note.updatedAt).toLocaleDateString()} • {new Date(note.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
