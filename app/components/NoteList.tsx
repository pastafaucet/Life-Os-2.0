'use client';

import React from 'react';
import { Note, Case, Person } from '../../lib/storage/types';
import NoteCard from './NoteCard';
import { Plus } from 'lucide-react';

interface NoteListProps {
  notes: Note[];
  cases: Case[];
  people: Person[];
  onCreateNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  categoryName?: string;
}

export default function NoteList({ 
  notes, 
  cases, 
  people, 
  onCreateNote, 
  onEditNote, 
  onDeleteNote,
  categoryName 
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">
            {categoryName ? `No notes in ${categoryName}` : 'No notes yet'}
          </h3>
          <p className="text-sm">
            Create your first note to get started organizing your knowledge
          </p>
        </div>
        <button
          onClick={onCreateNote}
          className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all font-medium"
        >
          Create Note
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          cases={cases}
          people={people}
          onEdit={onEditNote}
          onDelete={onDeleteNote}
        />
      ))}
    </div>
  );
}
