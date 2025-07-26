'use client';

import React from 'react';
import Navigation from './components/Navigation';
import { 
  CheckSquare, Brain, Briefcase, DollarSign, Heart, Home,
  Clock, TrendingUp, Calendar, FileText, Plus, Zap, AlertTriangle,
  Lightbulb, BarChart3, Target, Activity, BookOpen, Coffee, Dumbbell
} from 'lucide-react';

export default function Dashboard() {
  // Enhanced data - in real implementation, this would come from your data stores
  const todaysTasks = 12;
  const activeCases = 8;
  const netWorth = 125400; // $125.4k
  const healthScore = 87;
  const knowledgeItems = 2341;
  const habitStreak = 21;

  // Enhanced stats with better visuals and data
  const enhancedStats = [
    {
      label: "Tasks Today",
      value: todaysTasks.toString(),
      change: "85% on track",
      changeType: "positive",
      icon: CheckSquare,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      emoji: "📋"
    },
    {
      label: "Active Cases",
      value: activeCases.toString(),
      change: "2 hearings this week",
      changeType: "neutral",
      icon: Briefcase,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400",
      emoji: "⚖️"
    },
    {
      label: "Net Worth",
      value: `$${(netWorth / 1000).toFixed(1)}k`,
      change: "+3.2%",
      changeType: "positive",
      icon: DollarSign,
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-400",
      emoji: "💰"
    },
    {
      label: "Health Score",
      value: `${healthScore}%`,
      change: "+5 pts",
      changeType: "positive",
      icon: Heart,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-400",
      emoji: "❤️"
    },
    {
      label: "Knowledge Items",
      value: knowledgeItems.toLocaleString(),
      change: "+47 today",
      changeType: "positive",
      icon: Brain,
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
      emoji: "🧠"
    },
    {
      label: "Habit Streak",
      value: `${habitStreak}d`,
      change: "Keep going!",
      changeType: "positive",
      icon: Target,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
      emoji: "🎯"
    }
  ];

  // Quick actions for common tasks
  const quickActions = [
    { label: "New Task", icon: "➕", action: "task" },
    { label: "Quick Note", icon: "📝", action: "note" },
    { label: "Log Expense", icon: "💸", action: "expense" },
    { label: "Log Workout", icon: "🏃", action: "workout" },
    { label: "New Case", icon: "📄", action: "case" },
    { label: "Daily Review", icon: "📊", action: "review" },
    { label: "Log Meal", icon: "🍽️", action: "meal" },
    { label: "Check Habit", icon: "✅", action: "habit" }
  ];

  // Priority tasks with enhanced display
  const priorityTasks = [
    {
      title: "File motion - Anderson v. Blake",
      description: "Complete draft and file with court",
      dueTime: "Due by 5:00 PM",
      category: "Legal",
      priority: "P1",
      priorityColor: "bg-red-500/10 text-red-400 border-red-500/20",
      urgency: "danger"
    },
    {
      title: "Client meeting - Estate planning", 
      description: "Review documents for Thompson consultation",
      dueTime: "3:00 PM • 1 hour",
      category: "Meeting",
      priority: "P2",
      priorityColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      urgency: "warning"
    },
    {
      title: "Review Q3 financial statements",
      description: "Analyze expenses and update budget projections", 
      dueTime: "EOD • Finance",
      category: "Finance",
      priority: "P3",
      priorityColor: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      urgency: "normal"
    }
  ];

  // AI insights
  const aiInsights = [
    {
      type: "warning",
      icon: "⚠️",
      iconColor: "text-red-400",
      iconBg: "bg-red-500/10",
      title: "Upcoming deadline cluster",
      description: "You have 5 deadlines in the next 48 hours. Consider delegating or rescheduling lower priority items."
    },
    {
      type: "tip",
      icon: "💡", 
      iconColor: "text-green-400",
      iconBg: "bg-green-500/10",
      title: "Productivity pattern detected",
      description: "Your focus peaks between 9-11 AM. Schedule complex legal work during this window."
    },
    {
      type: "insight",
      icon: "📊",
      iconColor: "text-blue-400", 
      iconBg: "bg-blue-500/10",
      title: "Financial optimization opportunity",
      description: "Consider rebalancing portfolio - tech allocation at 42% vs 30% target."
    }
  ];

  // Enhanced recent activity
  const recentActivity = [
    {
      type: "task",
      icon: "✓",
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
      title: "Completed: Morning workout",
      description: "45 min • Upper body",
      time: "7:30 AM"
    },
    {
      type: "legal",
      icon: "📄",
      iconColor: "text-purple-400", 
      iconBg: "bg-purple-500/10",
      title: "Filed: Motion to dismiss",
      description: "Johnson v. State",
      time: "9:15 AM"
    },
    {
      type: "finance",
      icon: "💰",
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-500/10", 
      title: "Expense: Client lunch",
      description: "$85.40 • Deductible",
      time: "12:45 PM"
    }
  ];

  // Today's schedule
  const todaysSchedule = [
    { time: "2:00 PM", title: "Team meeting", description: "Weekly case review" },
    { time: "3:00 PM", title: "Client consultation", description: "Estate planning - Mr. Thompson" },
    { time: "4:30 PM", title: "Court deadline", description: "File response - Anderson case" }
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

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {enhancedStats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 transition-all hover:transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <div className={`text-xs flex items-center gap-1 ${
                    stat.changeType === 'positive' ? 'text-green-400' : 
                    stat.changeType === 'negative' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {stat.changeType === 'positive' && <span>↑</span>}
                    {stat.changeType === 'negative' && <span>↓</span>}
                    {stat.changeType === 'neutral' && <span>→</span>}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center text-lg`}>
                  {stat.emoji}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-8">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 hover:bg-gray-800/50 transition-all cursor-pointer text-center group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <div className="text-xs text-gray-400 group-hover:text-gray-300">
                {action.label}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Priority Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Priority Tasks */}
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Today's Priorities</h3>
                <button className="text-sm text-gray-400 hover:text-white transition-colors">
                  View All →
                </button>
              </div>
              <div className="space-y-4">
                {priorityTasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-all cursor-pointer"
                  >
                    <div className="w-5 h-5 border-2 border-gray-600 rounded mt-1"></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">{task.title}</h4>
                      <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{task.dueTime}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">{task.category}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${task.priorityColor}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">AI Insights</h3>
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-medium">
                  🤖 AI
                </span>
              </div>
              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg ${insight.iconBg} flex items-center justify-center text-lg flex-shrink-0`}>
                      {insight.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-400">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Activity & Schedule */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${activity.iconBg} flex items-center justify-center text-sm flex-shrink-0`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white">{activity.title}</h4>
                      <p className="text-xs text-gray-400">{activity.description}</p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Today's Schedule</h3>
                <button className="text-gray-400 hover:text-white transition-colors">
                  📅
                </button>
              </div>
              <div className="space-y-4">
                {todaysSchedule.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="text-xs text-gray-500 w-14 flex-shrink-0 pt-1">
                      {item.time}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">{item.title}</h4>
                      <p className="text-xs text-gray-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions FAB */}
        <div className="fixed bottom-6 right-6">
          <div className="flex flex-col space-y-3">
            <button className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110">
              <Plus className="h-7 w-7 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
