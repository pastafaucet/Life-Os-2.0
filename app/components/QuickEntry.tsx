'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { parseNaturalLanguage } from '@/lib/utils/parser';
import { Task, Case, Person } from '@/lib/storage/types';

interface ParsedTask {
  title: string;
  type: 'task' | 'call' | 'meeting' | 'deposition' | 'hearing';
  priority: 'DEADLINE' | 'P1' | 'P2' | 'QUICK' | 'SOMEDAY';
  doDate: string;
  deadline?: string;
  duration?: string;
  caseName?: string;
  personName?: string;
}

interface QuickEntryProps {
  onClose: () => void;
  onTaskCreate: (task: any) => void;
  cases: Case[];
  people: Person[];
}

export default function QuickEntry({ onClose, onTaskCreate, cases, people }: QuickEntryProps) {
  const [input, setInput] = useState('');
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);

  useEffect(() => {
    if (input.length > 3) {
      const parsed = parseNaturalLanguage(input, cases, people);
      setParsedTask(parsed);
    } else {
      setParsedTask(null);
    }
  }, [input, cases, people]);

  const handleSubmit = () => {
    if (parsedTask) {
      onTaskCreate(parsedTask);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && parsedTask) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">What needs to be done?</h3>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Try: "Call @bob at 2pm tomorrow #Smith"'
            className="w-full px-4 py-3 text-lg bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-gray-600 transition-all placeholder-gray-500"
            autoFocus
          />

          {/* Preview */}
          {parsedTask && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <p className="text-xs text-gray-500 mb-3">Preview:</p>
              <div className="space-y-2">
                <p className="font-medium">{parsedTask.title}</p>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-gray-400">Type: {parsedTask.type}</span>
                  <span className="text-gray-400">Priority: {parsedTask.priority}</span>
                  <span className="text-gray-400">Do: {parsedTask.doDate}</span>
                  {parsedTask.caseName && (
                    <span className="text-purple-400">Case: {parsedTask.caseName}</span>
                  )}
                  {parsedTask.personName && (
                    <span className="text-blue-400">Person: {parsedTask.personName}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
