'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  color: string;
  stats?: {
    primary: string;
    secondary?: string;
  };
  disabled?: boolean;
  recentItems?: string[];
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  icon: Icon,
  path,
  color,
  stats,
  disabled = false,
  recentItems = []
}) => {
  if (disabled) {
    return (
      <div className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-6 opacity-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gray-800/50`}>
              <Icon className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-500">{title}</h3>
              <p className="text-sm text-gray-600">Coming Soon</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      </div>
    );
  }

  return (
    <Link href={path} className="block group">
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 hover:bg-gray-800/30 hover:border-gray-700/50 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{title}</h3>
              {stats && (
                <p className="text-sm text-gray-400">
                  {stats.primary}
                  {stats.secondary && (
                    <span className="text-gray-500"> • {stats.secondary}</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
        
        <p className="text-sm text-gray-400 mb-4">{description}</p>
        
        {recentItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent</p>
            {recentItems.slice(0, 3).map((item, index) => (
              <div key={index} className="text-sm text-gray-300 truncate">
                • {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default DashboardCard;
