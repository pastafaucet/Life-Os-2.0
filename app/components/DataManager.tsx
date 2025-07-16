'use client';

import React from 'react';
import { Download, Upload, Trash2, Database } from 'lucide-react';
import { LocalStorage } from '@/lib/storage/localStorage';

export default function DataManager() {
  const handleExport = () => {
    const data = LocalStorage.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        LocalStorage.importData(data);
        window.location.reload(); // Refresh to show new data
      } catch (error) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      LocalStorage.clearAll();
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-xl">
      <p className="text-xs text-gray-500 mb-3 flex items-center">
        <Database className="h-3 w-3 mr-1" />
        Local Development Mode
      </p>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleExport}
          className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs transition-colors"
        >
          <Download className="h-3 w-3" />
          <span>Export</span>
        </button>
        
        <label className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs transition-colors cursor-pointer">
          <Upload className="h-3 w-3" />
          <span>Import</span>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
        
        <button
          onClick={handleClear}
          className="flex items-center space-x-1 px-3 py-1.5 bg-red-900/50 hover:bg-red-900/70 rounded text-xs transition-colors text-red-400"
        >
          <Trash2 className="h-3 w-3" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
}
