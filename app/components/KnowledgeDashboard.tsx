'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Brain } from 'lucide-react';
import { LocalStorage } from '../../lib/storage/localStorage';
import { Note, Category, Case, Person } from '../../lib/storage/types';
import CategoryNav from './CategoryNav';
import NoteList from './NoteList';
import QuickNoteCapture from './QuickNoteCapture';

export default function KnowledgeDashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Keyboard shortcut for ⌘⇧K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        setShowQuickCapture(true);
      }
      if (e.key === 'Escape' && showQuickCapture) {
        setShowQuickCapture(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showQuickCapture]);

  const loadData = () => {
    setNotes(LocalStorage.getNotes());
    setCategories(LocalStorage.getCategories());
    setCases(LocalStorage.getCases());
    setPeople(LocalStorage.getPeople());
  };

  const handleCreateNote = (noteData: {
    title: string;
    content: string;
    categoryId: string;
    linkedCaseIds: string[];
    linkedPersonIds: string[];
    tags: string[];
  }) => {
    LocalStorage.createNote(noteData);
    loadData(); // Refresh data to update counts
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    // Note editing will be implemented in Phase 1, Day 5-7
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      LocalStorage.deleteNote(noteId);
      loadData();
    }
  };

  // Filter notes based on active category and search
  const getFilteredNotes = () => {
    let filteredNotes = notes;

    // Filter by category
    if (activeCategory !== 'all') {
      filteredNotes = filteredNotes.filter(note => note.categoryId === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by most recent first
    return filteredNotes.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  };

  const filteredNotes = getFilteredNotes();
  const activeCategoryName = activeCategory === 'all' 
    ? 'All Notes' 
    : categories.find(cat => cat.id === activeCategory)?.name;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Knowledge Management Header */}
      <div className="border-b border-gray-800/50 backdrop-blur-xl bg-gray-900/50 sticky top-16 z-30">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Knowledge Hub
              </h1>
              <div className="w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50">
                <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-75"></div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="pl-10 pr-4 py-2 w-64 bg-gray-800/50 border border-gray-700/50 rounded-lg focus:ring-2 focus:ring-white/20 focus:border-gray-600 transition-all placeholder-gray-500 text-sm"
                />
              </div>
              
              {/* New Note Button */}
              <button
                onClick={() => setShowQuickCapture(true)}
                className="flex items-center space-x-2 px-4 py-1.5 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all font-medium text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>New Note</span>
                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 rounded font-mono">⌘⇧K</kbd>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Category Navigation */}
        <CategoryNav
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          totalNotes={notes.length}
        />

        {/* Notes List */}
        <NoteList
          notes={filteredNotes}
          cases={cases}
          people={people}
          onCreateNote={() => setShowQuickCapture(true)}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
          categoryName={activeCategoryName}
        />

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} found for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Quick Note Capture Modal */}
      <QuickNoteCapture
        isOpen={showQuickCapture}
        onClose={() => setShowQuickCapture(false)}
        onSave={handleCreateNote}
        categories={categories}
        cases={cases}
        people={people}
      />
    </div>
  );
}
