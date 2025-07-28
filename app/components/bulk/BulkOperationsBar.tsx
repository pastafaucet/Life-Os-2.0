'use client';

import React, { useState } from 'react';
import { Check, X, Tag, Folder, Archive, Trash2, Download, Sparkles, RefreshCw } from 'lucide-react';

interface BulkOperationsBarProps {
  selectedCount: number;
  onCategoryChange: (categoryId: string) => void;
  onTagsAdd: (tags: string[]) => void;
  onTagsRemove: (tags: string[]) => void;
  onStatusChange: (status: 'inbox' | 'active' | 'done' | 'archived') => void;
  onDelete: () => void;
  onExport: () => void;
  onAIAnalyze: () => void;
  onDeselectAll: () => void;
  categories: Array<{ id: string; name: string; icon: string }>;
  availableTags: string[];
  isProcessing?: boolean;
  processingProgress?: { current: number; total: number; action: string };
}

export default function BulkOperationsBar({
  selectedCount,
  onCategoryChange,
  onTagsAdd,
  onTagsRemove,
  onStatusChange,
  onDelete,
  onExport,
  onAIAnalyze,
  onDeselectAll,
  categories,
  availableTags,
  isProcessing = false,
  processingProgress
}: BulkOperationsBarProps) {
  const [activeAction, setActiveAction] = useState<'category' | 'tags' | 'status' | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [selectedTagsToRemove, setSelectedTagsToRemove] = useState<string[]>([]);

  if (selectedCount === 0) return null;

  const handleTagAdd = () => {
    if (tagInput.trim()) {
      const newTags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag);
      onTagsAdd(newTags);
      setTagInput('');
      setActiveAction(null);
    }
  };

  const handleTagRemove = () => {
    if (selectedTagsToRemove.length > 0) {
      onTagsRemove(selectedTagsToRemove);
      setSelectedTagsToRemove([]);
      setActiveAction(null);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    onCategoryChange(categoryId);
    setActiveAction(null);
  };

  const handleStatusChange = (status: 'inbox' | 'active' | 'done' | 'archived') => {
    onStatusChange(status);
    setActiveAction(null);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-sm">
        {/* Processing Progress Bar */}
        {isProcessing && processingProgress && (
          <div className="px-6 py-3 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">
                {processingProgress.action}
              </span>
              <span className="text-sm text-purple-400">
                {processingProgress.current} of {processingProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-500 rounded-full text-white font-medium text-sm">
                {selectedCount}
              </span>
              <span className="text-white font-medium">
                {selectedCount} note{selectedCount > 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={onDeselectAll}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              title="Deselect all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Main Actions */}
          <div className="flex items-center space-x-2 mb-4">
            {/* Category Change */}
            <div className="relative">
              <button
                onClick={() => setActiveAction(activeAction === 'category' ? null : 'category')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  activeAction === 'category' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                disabled={isProcessing}
              >
                <Folder className="h-4 w-4" />
                <span>Category</span>
              </button>
              
              {activeAction === 'category' && (
                <div className="absolute bottom-full mb-2 left-0 min-w-[200px] bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {categories.filter(cat => ['Notes', 'References', 'Media', 'Documents'].includes(cat.name)).map(category => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryChange(category.id)}
                        className="flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-700 rounded-lg transition-all text-sm"
                      >
                        <span>{category.icon}</span>
                        <span className="text-gray-300">{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="relative">
              <button
                onClick={() => setActiveAction(activeAction === 'tags' ? null : 'tags')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  activeAction === 'tags' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                disabled={isProcessing}
              >
                <Tag className="h-4 w-4" />
                <span>Tags</span>
              </button>
              
              {activeAction === 'tags' && (
                <div className="absolute bottom-full mb-2 left-0 min-w-[300px] bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4">
                  {/* Add Tags */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Add Tags</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleTagAdd()}
                        placeholder="tag1, tag2, tag3"
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                      <button
                        onClick={handleTagAdd}
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Remove Tags */}
                  {availableTags.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Remove Tags</label>
                      <div className="max-h-32 overflow-y-auto">
                        <div className="space-y-1">
                          {availableTags.map(tag => (
                            <label key={tag} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={selectedTagsToRemove.includes(tag)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTagsToRemove([...selectedTagsToRemove, tag]);
                                  } else {
                                    setSelectedTagsToRemove(selectedTagsToRemove.filter(t => t !== tag));
                                  }
                                }}
                                className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500/20"
                              />
                              <span className="text-gray-300">+{tag}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {selectedTagsToRemove.length > 0 && (
                        <button
                          onClick={handleTagRemove}
                          className="mt-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all text-sm"
                        >
                          Remove Selected
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Change */}
            <div className="relative">
              <button
                onClick={() => setActiveAction(activeAction === 'status' ? null : 'status')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  activeAction === 'status' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                disabled={isProcessing}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Status</span>
              </button>
              
              {activeAction === 'status' && (
                <div className="absolute bottom-full mb-2 left-0 min-w-[180px] bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2">
                  <div className="space-y-1">
                    {[
                      { status: 'inbox' as const, icon: '📥', label: 'Inbox' },
                      { status: 'active' as const, icon: '🔄', label: 'Active' },
                      { status: 'done' as const, icon: '✅', label: 'Done' },
                      { status: 'archived' as const, icon: '📦', label: 'Archived' }
                    ].map(({ status, icon, label }) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-gray-700 rounded-lg transition-all text-sm"
                      >
                        <span>{icon}</span>
                        <span className="text-gray-300">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={onAIAnalyze}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all text-sm"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>AI Analyze</span>
              </button>

              <button
                onClick={onExport}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>

            <button
              onClick={onDelete}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all text-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
