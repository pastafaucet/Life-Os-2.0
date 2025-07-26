'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Category, Case, Person } from '../../lib/storage/types';

interface QuickNoteCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: {
    title: string;
    content: string;
    categoryId: string;
    linkedCaseIds: string[];
    linkedPersonIds: string[];
    tags: string[];
  }) => void;
  categories: Category[];
  cases: Case[];
  people: Person[];
}

export default function QuickNoteCapture({ 
  isOpen, 
  onClose, 
  onSave, 
  categories, 
  cases, 
  people 
}: QuickNoteCaptureProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [linkedCaseIds, setLinkedCaseIds] = useState<string[]>([]);
  const [linkedPersonIds, setLinkedPersonIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setTitle('');
      setContent('');
      setSelectedCategoryId('');
      setLinkedCaseIds([]);
      setLinkedPersonIds([]);
      setTags([]);
      setNewTag('');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!title.trim() || !selectedCategoryId) return;

    onSave({
      title: title.trim(),
      content: content.trim(),
      categoryId: selectedCategoryId,
      linkedCaseIds,
      linkedPersonIds,
      tags
    });

    onClose();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleCase = (caseId: string) => {
    setLinkedCaseIds(prev => 
      prev.includes(caseId) 
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const togglePerson = (personId: string) => {
    setLinkedPersonIds(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Create Note</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full px-4 py-3 text-lg bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-gray-600 transition-all placeholder-gray-500"
              autoFocus
            />
          </div>

          {/* Category (Required) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">Category *</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-gray-600 transition-all"
            >
              <option value="">Select a category...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note content here..."
              rows={8}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-gray-600 transition-all placeholder-gray-500 resize-none"
            />
          </div>

          {/* Linked Cases */}
          {cases.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Linked Cases</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {cases.map(case_ => (
                  <label key={case_.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkedCaseIds.includes(case_.id)}
                      onChange={() => toggleCase(case_.id)}
                      className="rounded border-gray-600 bg-gray-800 text-white focus:ring-white/20"
                    />
                    <span className="text-sm text-gray-300">{case_.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Linked People */}
          {people.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Linked People</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {people.map(person => (
                  <label key={person.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkedPersonIds.includes(person.id)}
                      onChange={() => togglePerson(person.id)}
                      className="rounded border-gray-600 bg-gray-800 text-white focus:ring-white/20"
                    />
                    <span className="text-sm text-gray-300">{person.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white/20 focus:border-gray-600 transition-all placeholder-gray-500"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span 
                  key={tag}
                  className="px-2 py-1 bg-gray-500/20 text-gray-400 border-gray-500/30 border rounded flex items-center space-x-1"
                >
                  <span>{tag}</span>
                  <button 
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !selectedCategoryId}
              className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
