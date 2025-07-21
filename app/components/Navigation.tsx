'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, CheckSquare, Brain, Briefcase, 
  DollarSign, Heart, Home, Search, Settings, User
} from 'lucide-react';

const Navigation = () => {
  const pathname = usePathname();
  
  const modules = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', color: 'text-blue-400' },
    { name: 'Tasks', icon: CheckSquare, path: '/tasks', color: 'text-green-400' },
    { name: 'Knowledge', icon: Brain, path: '/knowledge', color: 'text-purple-400' },
    { name: 'Legal', icon: Briefcase, path: '/legal', color: 'text-yellow-400', disabled: true },
    { name: 'Finance', icon: DollarSign, path: '/finance', color: 'text-emerald-400', disabled: true },
    { name: 'Health', icon: Heart, path: '/health', color: 'text-red-400', disabled: true },
    { name: 'Life', icon: Home, path: '/life', color: 'text-orange-400', disabled: true },
  ];
  
  return (
    <nav className="border-b border-gray-800/50 backdrop-blur-xl bg-gray-900/50 sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LOS</span>
            </div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Life OS
            </h1>
          </Link>
          
          {/* Module Navigation */}
          <div className="flex items-center space-x-1">
            {modules.map((module) => {
              const Icon = module.icon;
              const isActive = pathname === module.path;
              const isDisabled = module.disabled;
              
              if (isDisabled) {
                return (
                  <div
                    key={module.name}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 cursor-not-allowed"
                    title="Coming Soon"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{module.name}</span>
                  </div>
                );
              }
              
              return (
                <Link
                  key={module.name}
                  href={module.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                    isActive
                      ? `bg-white/10 ${module.color}`
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{module.name}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all">
              <Search className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all">
              <Settings className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
