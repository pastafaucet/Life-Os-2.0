'use client';

import React from 'react';
import Navigation from './components/Navigation';
import DashboardCard from './components/DashboardCard';
import { 
  CheckSquare, Brain, Briefcase, DollarSign, Heart, Home,
  Clock, TrendingUp, Calendar, FileText, Plus, Zap
} from 'lucide-react';

export default function Dashboard() {
  // Mock data - in real implementation, this would come from your data stores
  const todaysTasks = 5;
  const totalNotes = 0; // Knowledge system not built yet
  const activeCases = 0; // Legal system not built yet
  const netWorth = 0; // Finance system not built yet

  const recentTasks = [
    "Review contract for Smith case",
    "Call opposing counsel at 2pm",
    "Prepare deposition questions"
  ];

  const recentNotes = [
    // Will be populated when knowledge system is built
  ];

  const modules = [
    {
      title: "Task Management",
      description: "Organize work and personal tasks with AI-powered insights",
      icon: CheckSquare,
      path: "/tasks",
      color: "from-green-500 to-emerald-600",
      stats: {
        primary: `${todaysTasks} due today`,
        secondary: "12 active"
      },
      recentItems: recentTasks
    },
    {
      title: "Knowledge Hub",
      description: "Capture, organize, and retrieve all your information",
      icon: Brain,
      path: "/knowledge",
      color: "from-purple-500 to-violet-600",
      stats: {
        primary: totalNotes > 0 ? `${totalNotes} notes` : "Ready to start",
        secondary: totalNotes > 0 ? "Searchable" : undefined
      },
      recentItems: recentNotes
    },
    {
      title: "Legal Practice",
      description: "Case management, deadlines, and court integration",
      icon: Briefcase,
      path: "/legal",
      color: "from-yellow-500 to-orange-600",
      disabled: true,
      stats: {
        primary: "Phase 2",
        secondary: "Q2 2025"
      }
    },
    {
      title: "Financial Intelligence",
      description: "Net worth tracking, expenses, and investment analysis",
      icon: DollarSign,
      path: "/finance",
      color: "from-emerald-500 to-teal-600",
      disabled: true,
      stats: {
        primary: "Phase 3",
        secondary: "Q3 2025"
      }
    },
    {
      title: "Health & Wellness",
      description: "Fitness tracking, nutrition, and health optimization",
      icon: Heart,
      path: "/health",
      color: "from-red-500 to-pink-600",
      disabled: true,
      stats: {
        primary: "Phase 4",
        secondary: "Q4 2025"
      }
    },
    {
      title: "Life Management",
      description: "Household, travel, entertainment, and learning",
      icon: Home,
      path: "/life",
      color: "from-orange-500 to-red-600",
      disabled: true,
      stats: {
        primary: "Phase 5",
        secondary: "2026"
      }
    }
  ];

  const quickStats = [
    {
      label: "Today's Tasks",
      value: todaysTasks.toString(),
      icon: CheckSquare,
      color: "text-green-400"
    },
    {
      label: "This Week",
      value: "23 tasks",
      icon: Calendar,
      color: "text-blue-400"
    },
    {
      label: "Knowledge Base",
      value: totalNotes > 0 ? `${totalNotes} notes` : "Ready",
      icon: Brain,
      color: "text-purple-400"
    },
    {
      label: "Productivity",
      value: "↗ 15%",
      icon: TrendingUp,
      color: "text-emerald-400"
    }
  ];

  const recentActivity = [
    { type: "task", text: "Completed: Call client about settlement", time: "2 hours ago" },
    { type: "task", text: "Created: Prepare for deposition", time: "4 hours ago" },
    { type: "system", text: "AI estimated task times for today", time: "This morning" },
    { type: "task", text: "Completed: Review discovery documents", time: "Yesterday" }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navigation />
      
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
            Welcome back
          </h1>
          <p className="text-gray-400">
            Your Life Operating System • {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Module Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {modules.map((module, index) => (
            <DashboardCard
              key={index}
              title={module.title}
              description={module.description}
              icon={module.icon}
              path={module.path}
              color={module.color}
              stats={module.stats}
              disabled={module.disabled}
              recentItems={module.recentItems}
            />
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'task' ? 'bg-green-400' : 'bg-blue-400'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{activity.text}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="fixed bottom-6 right-6">
          <div className="flex flex-col space-y-3">
            <button className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-all">
              <Plus className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
