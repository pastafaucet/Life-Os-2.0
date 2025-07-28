'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  helpText?: string;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionButton,
  helpText,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="max-w-md mx-auto">
        {/* Large emoji/icon display */}
        <div className="text-6xl mb-6 opacity-60">
          {icon}
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-3">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-400 mb-6 leading-relaxed">
          {description}
        </p>
        
        {/* Action Button */}
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
              actionButton.variant === 'secondary'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            <Plus className="h-5 w-5" />
            <span>{actionButton.label}</span>
          </button>
        )}
        
        {/* Help Text */}
        {helpText && (
          <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <p className="text-sm text-gray-400">
              💡 <span className="font-medium">Tip:</span> {helpText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
