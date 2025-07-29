'use client';

import React from 'react';
import { Note, Case, Person } from '../../lib/storage/types';
import { Calendar, User, Briefcase, Tag, MoreHorizontal, Star } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  cases: Case[];
  people: Person[];
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onToggleFavorite: (noteId: string) => void;
}

export default function NoteCard({ note, cases, people, onEdit, onDelete, onToggleFavorite }: NoteCardProps) {
  // Get linked case names
  const linkedCaseNames = note.linkedCaseIds
    .map(caseId => cases.find(c => c.id === caseId)?.name)
    .filter(Boolean);

  // Get linked person names
  const linkedPersonNames = note.linkedPersonIds
    .map(personId => people.find(p => p.id === personId)?.name)
    .filter(Boolean);

  // Create preview text from content
  const getPreviewText = (content: string) => {
    const plainText = content.replace(/[#*_`]/g, ''); // Basic markdown removal
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(note.id);
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:bg-gray-800/30 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 
              className="font-medium text-white text-lg hover:text-gray-300 transition-colors cursor-pointer flex-1"
              onClick={() => onEdit(note)}
            >
              {note.title}
            </h3>
            {/* Favorite Star */}
            <button
              onClick={handleStarClick}
              className={`p-1 rounded transition-all ${
                note.isFavorite 
                  ? 'text-yellow-400 hover:text-yellow-300' 
                  : 'text-gray-500 hover:text-yellow-400'
              }`}
              title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star 
                className={`h-4 w-4 ${note.isFavorite ? 'fill-current' : ''}`} 
              />
            </button>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500">
              {new Date(note.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        {/* Action Menu */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(note)}
            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Preview */}
      {note.content && (
        <p className="text-gray-400 text-sm mb-3 leading-relaxed">
          {getPreviewText(note.content)}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center flex-wrap gap-2 text-xs">
        {/* Linked Cases */}
        {linkedCaseNames.map((caseName, index) => (
          <span 
            key={index}
            className="flex items-center space-x-1 px-2 py-1 bg-purple-500/20 text-purple-400 border-purple-500/30 border rounded"
          >
            <Briefcase className="h-3 w-3" />
            <span>{caseName}</span>
          </span>
        ))}

        {/* Linked People */}
        {linkedPersonNames.map((personName, index) => (
          <span 
            key={index}
            className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 text-blue-400 border-blue-500/30 border rounded"
          >
            <User className="h-3 w-3" />
            <span>{personName}</span>
          </span>
        ))}

        {/* Tags */}
        {note.tags.map((tag, index) => (
          <span 
            key={index}
            className="flex items-center space-x-1 px-2 py-1 bg-gray-500/20 text-gray-400 border-gray-500/30 border rounded"
          >
            <Tag className="h-3 w-3" />
            <span>{tag}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
