'use client';

import React from 'react';
import Navigation from '../components/Navigation';
import { Brain, Plus, Search, FileText, Tag, Calendar } from 'lucide-react';

export default function KnowledgePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navigation />
      
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
            Knowledge Hub
          </h1>
          <p className="text-gray-400">
            Capture, organize, and retrieve all your information
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 hover:bg-gray-800/30 transition-all text-left group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white">New Note</h3>
            </div>
            <p className="text-sm text-gray-400">Capture thoughts and ideas</p>
          </button>

          <button className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 hover:bg-gray-800/30 transition-all text-left group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Search className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white">Search Knowledge</h3>
            </div>
            <p className="text-sm text-gray-400">Find anything instantly</p>
          </button>

          <button className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 hover:bg-gray-800/30 transition-all text-left group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <Tag className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white">Browse Tags</h3>
            </div>
            <p className="text-sm text-gray-400">Explore by categories</p>
          </button>
        </div>

        {/* Coming Soon Message */}
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-6">
            <Brain className="h-8 w-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Knowledge System Coming Soon
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            The Knowledge Hub will be your central place for notes, documents, research, and information management with AI-powered search and organization.
          </p>
          
          <div className="text-sm text-gray-500">
            <p>Planned Features:</p>
            <ul className="mt-4 space-y-2 text-left max-w-sm mx-auto">
              <li className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Rich text notes and documents</span>
              </li>
              <li className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>AI-powered semantic search</span>
              </li>
              <li className="flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <span>Smart tagging and categorization</span>
              </li>
              <li className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Meeting notes and task integration</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
