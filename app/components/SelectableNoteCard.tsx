'use client';

import React from 'react';
import { Edit3, Trash2, Sparkles, Star } from 'lucide-react';
import { Note, Category, Topic } from '../../lib/storage/types';

interface SelectableNoteCardProps {
  note: Note;
  category?: Category;
  linkedTopics: Topic[];
  linkedPeople: Array<{ id: string; name: string }>;
  linkedCases: Array<{ id: string; name: string }>;
  isSelected: boolean;
  isSelectable: boolean;
  showAIAnalysis?: boolean;
  aiAnalysis?: {
    summary: string;
    suggestedCategory: string;
    keyTopics: string[];
    relevanceScore: number;
    insights: string[];
  };
  isAnalyzing?: boolean;
  onSelect: (noteId: string, selected: boolean) => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onAnalyze: (noteId: string) => void;
  onToggleAnalysis: (noteId: string) => void;
  onCycleCategory: (noteId: string) => void;
  onEditTag: (noteId: string, tagIndex: number, currentValue: string) => void;
  onEditPerson: (noteId: string, personId: string, currentValue: string) => void;
  onEditCase: (noteId: string, caseId: string, currentValue: string) => void;
  onEditTopic: (noteId: string, topicId: string, currentValue: string) => void;
  onToggleFavorite: (noteId: string) => void;
}

export default function SelectableNoteCard({
  note,
  category,
  linkedTopics,
  linkedPeople,
  linkedCases,
  isSelected,
  isSelectable,
  showAIAnalysis,
  aiAnalysis,
  isAnalyzing,
  onSelect,
  onEdit,
  onDelete,
  onAnalyze,
  onToggleAnalysis,
  onCycleCategory,
  onEditTag,
  onEditPerson,
  onEditCase,
  onEditTopic,
  onToggleFavorite
}: SelectableNoteCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('input') ||
      target.closest('button') ||
      target.closest('.badge-clickable')
    ) {
      return;
    }

    if (isSelectable) {
      onSelect(note.id, !isSelected);
    } else {
      onEdit(note);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(note.id, !isSelected);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'inbox':
        return {
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          border: 'border-gray-500/30',
          icon: '📥'
        };
      case 'active':
        return {
          bg: 'bg-blue-500/20',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          icon: '🔄'
        };
      case 'done':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          border: 'border-green-500/30',
          icon: '✅'
        };
      case 'archived':
        return {
          bg: 'bg-purple-500/20',
          text: 'text-purple-400',
          border: 'border-purple-500/30',
          icon: '📦'
        };
      default:
        return {
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          border: 'border-gray-500/30',
          icon: '📥'
        };
    }
  };

  const statusStyle = getStatusStyle(note.status);

  return (
    <div 
      className={`border rounded-xl p-4 transition-all group cursor-pointer ${
        isSelected 
          ? 'bg-purple-500/10 border-purple-500/50 shadow-lg' 
          : 'bg-gray-900/50 border-gray-800/50 hover:border-gray-700/50'
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {/* Selection Checkbox */}
            {isSelectable && (
              <div 
                className="mr-3 flex-shrink-0"
                onClick={handleCheckboxClick}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}} // Controlled by parent
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500/20 cursor-pointer"
                />
              </div>
            )}

            <h3 className="text-lg font-medium text-white mr-2 flex-1">{note.title}</h3>
            
            {/* Status Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              {statusStyle.icon} {note.status}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              {/* Category Badge */}
              {category && (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCycleCategory(note.id);
                  }}
                  className="badge-clickable inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 cursor-pointer hover:bg-purple-500/30 transition-all group/category"
                  title="Click to cycle category"
                >
                  {category.icon} {category.name}
                  <span className="ml-1 opacity-0 group-hover/category:opacity-100 transition-opacity text-xs">↻</span>
                </span>
              )}

              {/* Topic Badges */}
              {linkedTopics.map(topic => (
                <span 
                  key={topic.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTopic(note.id, topic.id, topic.name);
                  }}
                  className="badge-clickable inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 cursor-pointer hover:bg-orange-500/30 transition-all"
                  title="Click to edit topic"
                >
                  ~ {topic.name}
                </span>
              ))}

              {/* People Badges */}
              {linkedPeople.map(person => (
                <span 
                  key={person.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPerson(note.id, person.id, person.name);
                  }}
                  className="badge-clickable inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-pointer hover:bg-blue-500/30 transition-all"
                  title="Click to edit person"
                >
                  @ {person.name}
                </span>
              ))}

              {/* Case Badges */}
              {linkedCases.map(caseItem => (
                <span 
                  key={caseItem.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCase(note.id, caseItem.id, caseItem.name);
                  }}
                  className="badge-clickable inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-500/20 text-green-400 border border-green-500/30 cursor-pointer hover:bg-green-500/30 transition-all"
                  title="Click to edit case"
                >
                  # {caseItem.name}
                </span>
              ))}

              {/* Tag Badges */}
              {note.tags.map((tag, tagIndex) => (
                <span 
                  key={`${tag}-${tagIndex}`} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTag(note.id, tagIndex, tag);
                  }}
                  className="badge-clickable inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 cursor-pointer hover:bg-yellow-500/30 transition-all"
                  title="Click to edit tag"
                >
                  + {tag}
                </span>
              ))}
            </div>
            
            <span className="text-xs text-gray-500 flex-shrink-0 ml-4">
              {new Date(note.updatedAt).toLocaleDateString()} • {new Date(note.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className={`flex items-center space-x-2 ml-4 ${isSelectable ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          {/* Favorite Star */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(note.id);
            }}
            className={`p-2 rounded-lg transition-all ${
              note.isFavorite 
                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10' 
                : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10'
            }`}
            title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star 
              className={`h-4 w-4 ${note.isFavorite ? 'fill-current' : ''}`} 
            />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (aiAnalysis) {
                onToggleAnalysis(note.id);
              } else {
                onAnalyze(note.id);
              }
            }}
            className="p-2 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
            title={aiAnalysis ? "Toggle AI Analysis" : "Analyze with AI"}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
            title="Edit Note"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            title="Delete Note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* AI Analysis Display */}
      {aiAnalysis && showAIAnalysis && (
        <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-purple-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Analysis
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleAnalysis(note.id);
              }}
              className="text-gray-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
          
          {aiAnalysis.summary && (
            <p className="text-sm text-gray-300 mb-3">{aiAnalysis.summary}</p>
          )}
          
          {aiAnalysis.keyTopics.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Key Topics:</p>
              <div className="flex flex-wrap gap-2">
                {aiAnalysis.keyTopics.map((topic, index) => (
                  <span key={index} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {aiAnalysis.insights.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Insights:</p>
              <ul className="space-y-1">
                {aiAnalysis.insights.map((insight, index) => (
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
  );
}
