'use client';

import React, { useState } from 'react';
import { 
  Calendar, Clock, User, Briefcase, AlertTriangle,
  MoreHorizontal, Edit3, Trash2 
} from 'lucide-react';
import { Task, Case, Person } from '@/lib/storage/types';

interface TaskItemProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  cases: Case[];
  people: Person[];
}

export default function TaskItem({ task, onUpdate, onDelete, cases, people }: TaskItemProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const priorityStyles = {
    'DEADLINE': 'bg-red-500/20 text-red-400 border-red-500/30',
    'P1': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'P2': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'QUICK': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'SOMEDAY': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  const typeIcons = {
    'call': '📞',
    'meeting': '📅',
    'deposition': '📝',
    'task': '✓',
    'hearing': '⚖️'
  };

  const handleEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  const handleSave = () => {
    if (editingField) {
      onUpdate(task.id, { [editingField]: editValue });
      setEditingField(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  const cyclePriority = () => {
    const priorities: Task['priority'][] = ['DEADLINE', 'P1', 'P2', 'QUICK', 'SOMEDAY'];
    const currentIndex = priorities.indexOf(task.priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    onUpdate(task.id, { priority: priorities[nextIndex] });
  };

  // Find related case and person info
  const relatedCase = task.caseId ? cases.find(c => c.id === task.caseId) : null;
  const relatedPerson = task.personId ? people.find(p => p.id === task.personId) : null;

  return (
    <div className={`bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:bg-gray-800/30 transition-all cursor-pointer group ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <input 
            type="checkbox" 
            checked={task.completed}
            onChange={(e) => onUpdate(task.id, { completed: e.target.checked })}
            className="h-5 w-5 rounded border-gray-600 bg-gray-800 text-white focus:ring-white/20" 
          />
          <span className="text-xl">{typeIcons[task.type]}</span>
          
          <div className="flex-1">
            {/* Title */}
            {editingField === 'title' ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                autoFocus
              />
            ) : (
              <p 
                className={`font-medium text-white text-lg hover:text-gray-300 transition-colors ${task.completed ? 'line-through' : ''}`}
                onDoubleClick={() => handleEdit('title', task.title)}
              >
                {task.title}
              </p>
            )}
            
            {/* Metadata row */}
            <div className="flex items-center space-x-4 mt-2">
              {/* Priority */}
              <span 
                className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 ${priorityStyles[task.priority]}`}
                onClick={cyclePriority}
              >
                {task.priority}
              </span>
              
              {/* Do Date */}
              {editingField === 'doDate' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  className="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-sm"
                  autoFocus
                />
              ) : (
                <span 
                  className="text-sm text-gray-400 flex items-center cursor-pointer hover:text-white"
                  onDoubleClick={() => handleEdit('doDate', task.doDate)}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {task.doDate}
                </span>
              )}

              {/* Case */}
              {relatedCase && (
                <span className="text-sm text-purple-400 flex items-center cursor-pointer hover:bg-purple-500/20 px-2 py-0.5 rounded transition-all">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {relatedCase.name}
                </span>
              )}

              {/* Person */}
              {relatedPerson && (
                <span className="text-sm text-blue-400 flex items-center cursor-pointer hover:bg-blue-500/20 px-2 py-0.5 rounded transition-all">
                  <User className="h-3 w-3 mr-1" />
                  {relatedPerson.name}
                </span>
              )}

              {/* Duration */}
              {task.duration && (
                <span className="text-sm text-gray-400 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {task.duration}
                </span>
              )}

              {/* Deadline */}
              {task.deadline && (
                <span className="text-sm text-red-400 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Deadline: {task.deadline}
                </span>
              )}
            </div>

            {/* Notes preview on hover */}
            {task.notes && (
              <p className="text-sm text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {task.notes}
              </p>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onDelete(task.id)}
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
