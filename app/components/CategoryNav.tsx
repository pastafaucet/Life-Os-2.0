'use client';

import React from 'react';
import { Category } from '../../lib/storage/types';

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  totalNotes: number;
}

export default function CategoryNav({ 
  categories, 
  activeCategory, 
  onCategoryChange, 
  totalNotes 
}: CategoryNavProps) {
  return (
    <div className="flex items-center space-x-1 mb-6">
      {/* All Notes Tab */}
      <button
        onClick={() => onCategoryChange('all')}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          activeCategory === 'all'
            ? 'bg-white text-gray-900'
            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
        }`}
      >
        All Notes ({totalNotes})
      </button>
      
      {/* Category Tabs */}
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
            activeCategory === category.id
              ? 'bg-white text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <span className="text-lg">{category.icon}</span>
          <span>{category.name} ({category.noteCount})</span>
        </button>
      ))}
    </div>
  );
}
