'use client';

import React from 'react';
import { X, Search, Plus, Save, Zap, Edit3, Trash2, Target } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  const shortcutSections = [
    {
      title: "Search & Navigation",
      icon: <Search className="h-5 w-5 text-blue-400" />,
      shortcuts: [
        { keys: ["Ctrl", "K"], description: "Focus search input" },
        { keys: ["Esc"], description: "Clear search or close modals" },
        { keys: ["Tab"], description: "Navigate between elements" },
        { keys: ["Shift", "Tab"], description: "Navigate backwards" }
      ]
    },
    {
      title: "Note Management",
      icon: <Plus className="h-5 w-5 text-green-400" />,
      shortcuts: [
        { keys: ["Ctrl", "N"], description: "Create new note (coming soon)" },
        { keys: ["Ctrl", "S"], description: "Save note in modal editor" },
        { keys: ["Ctrl", "Enter"], description: "Quick save and close (coming soon)" },
        { keys: ["Enter"], description: "Create note from quick input" }
      ]
    },
    {
      title: "Selection & Actions",
      icon: <Target className="h-5 w-5 text-purple-400" />,
      shortcuts: [
        { keys: ["Ctrl", "A"], description: "Select all visible notes (coming soon)" },
        { keys: ["Delete"], description: "Delete selected notes (coming soon)" },
        { keys: ["Ctrl", "Z"], description: "Undo last action (coming soon)" }
      ]
    },
    {
      title: "Views & Help",
      icon: <Zap className="h-5 w-5 text-orange-400" />,
      shortcuts: [
        { keys: ["F1"], description: "Show this help modal" },
        { keys: ["Ctrl", "?"], description: "Show help (alternative)" },
        { keys: ["1", "2", "3", "4"], description: "Switch between views (coming soon)" }
      ]
    }
  ];

  const searchTips = [
    { symbol: "@person", description: "Search for specific people", example: "@John" },
    { symbol: "#case", description: "Search for specific cases", example: "#ProjectAlpha" },
    { symbol: "~topic", description: "Search for specific topics", example: "~marketing" },
    { symbol: "+tag", description: "Search for specific tags", example: "+urgent" },
    { symbol: "category:", description: "Search within category", example: "category:References" },
    { symbol: '"exact"', description: "Exact phrase search", example: '"meeting notes"' },
    { symbol: "-exclude", description: "Exclude terms", example: "-archived" }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⌨️</span>
            <div>
              <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
              <p className="text-gray-400 text-sm">Master your Knowledge Hub workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            title="Close (ESC)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Keyboard Shortcuts */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <span>⚡</span>
                <span>Keyboard Shortcuts</span>
              </h3>
              
              {shortcutSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    {section.icon}
                    <h4 className="font-medium text-white">{section.title}</h4>
                  </div>
                  <div className="space-y-2">
                    {section.shortcuts.map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {shortcut.keys.map((key, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              <kbd className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs font-mono text-gray-300">
                                {key}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="text-gray-500 text-xs">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <span className="text-sm text-gray-400 flex-1 ml-4">{shortcut.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Search Syntax */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <span>🔍</span>
                <span>Advanced Search Syntax</span>
              </h3>
              
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="font-medium text-white mb-3">Search Symbols</h4>
                <div className="space-y-3">
                  {searchTips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <code className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs font-mono text-blue-300 flex-shrink-0">
                        {tip.symbol}
                      </code>
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">{tip.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Example: <code className="text-purple-300">{tip.example}</code></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="font-medium text-white mb-3">Search Examples</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <code className="text-green-300">@John #ProjectX +urgent</code>
                    <p className="text-gray-400 text-xs mt-1">Find notes with John, in ProjectX case, tagged urgent</p>
                  </div>
                  <div className="text-sm">
                    <code className="text-green-300">"meeting notes" -archived</code>
                    <p className="text-gray-400 text-xs mt-1">Find exact phrase "meeting notes" but exclude archived items</p>
                  </div>
                  <div className="text-sm">
                    <code className="text-green-300">category:References ~research</code>
                    <p className="text-gray-400 text-xs mt-1">Find references about research topic</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-400 text-lg">💡</span>
                  <div>
                    <h4 className="font-medium text-blue-300 mb-2">Pro Tips</h4>
                    <ul className="text-sm text-blue-200 space-y-1">
                      <li>• Use Ctrl+K to quickly focus the search</li>
                      <li>• Search suggestions appear as you type</li>
                      <li>• Press ESC to clear search and see all notes</li>
                      <li>• Combine multiple symbols for precise searches</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              💡 Tip: Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">F1</kbd> anytime to open this help
            </div>
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all font-medium"
            >
              <span>Got it!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
