'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'danger' | 'warning';
  previewContent?: {
    type: 'single' | 'multiple';
    items: Array<{
      title: string;
      subtitle?: string;
    }>;
  };
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'danger',
  previewContent
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getSeverityStyles = () => {
    switch (severity) {
      case 'danger':
        return {
          icon: Trash2,
          iconBg: 'bg-red-500/10',
          iconColor: 'text-red-400',
          confirmButton: 'bg-red-500 hover:bg-red-600 text-white',
          border: 'border-red-500/30',
          accent: 'text-red-400'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-orange-500/10',
          iconColor: 'text-orange-400',
          confirmButton: 'bg-orange-500 hover:bg-orange-600 text-white',
          border: 'border-orange-500/30',
          accent: 'text-orange-400'
        };
      default:
        return {
          icon: AlertTriangle,
          iconBg: 'bg-red-500/10',
          iconColor: 'text-red-400',
          confirmButton: 'bg-red-500 hover:bg-red-600 text-white',
          border: 'border-red-500/30',
          accent: 'text-red-400'
        };
    }
  };

  const styles = getSeverityStyles();
  const IconComponent = styles.icon;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${styles.iconBg}`}>
              <IconComponent className={`h-5 w-5 ${styles.iconColor}`} />
            </div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <p className="text-gray-300 mb-4 leading-relaxed">{message}</p>

          {/* Preview Content */}
          {previewContent && (
            <div className={`mb-6 p-4 bg-gray-800/50 rounded-lg border ${styles.border}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">
                  {previewContent.type === 'single' ? 'Item to be affected:' : 'Items to be affected:'}
                </span>
                <span className={`text-sm font-medium ${styles.accent}`}>
                  {previewContent.items.length} {previewContent.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {previewContent.items.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {previewContent.items.length > 5 && (
                  <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700/50">
                    +{previewContent.items.length - 5} more items
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-all"
            >
              <span>{cancelText}</span>
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex items-center space-x-2 px-6 py-2 rounded-xl transition-all font-medium ${styles.confirmButton}`}
            >
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
