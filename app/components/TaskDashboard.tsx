'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Clock, User, Briefcase, Hash, AlertTriangle, 
  Zap, Brain, CheckCircle, ArrowRight, X, MoreHorizontal,
  Edit3, Trash2, Copy, Flag, Archive, ChevronDown, Save
} from 'lucide-react';

export default function TaskDashboard() {
  const [quickEntry, setQuickEntry] = useState('');
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [parsedTask, setParsedTask] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [showTaskMenu, setShowTaskMenu] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteType, setAutocompleteType] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draggedTask, setDraggedTask] = useState(null);

  // View navigation state
  const [currentView, setCurrentView] = useState('Today');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Data arrays - will be populated from localStorage or user input
  const cases = [];
  const people = [];
  const [tasks, setTasks] = useState([]);

  // Natural language parser
  const parseNaturalLanguage = (input) => {
    const parsed = {
      title: input,
      doDate: "Today",
      priority: "P2",
      type: "task"
    };

    // Extract date and time information
    let workingInput = input.toLowerCase();
    let extractedDateTime = null;

    // Match time patterns (12:30 pm, 2:00, 3pm, etc.)
    const timeMatch = workingInput.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/);
    let timeString = '';
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      let minute = timeMatch[2] || '00';
      let period = timeMatch[3] || '';
      
      // Convert to readable format
      if (period.includes('p') && hour < 12) hour += 12;
      if (period.includes('a') && hour === 12) hour = 0;
      
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      const displayPeriod = hour >= 12 ? 'PM' : 'AM';
      timeString = ` ${displayHour}:${minute} ${displayPeriod}`;
    }

    // Match date patterns
    if (workingInput.includes('tomorrow')) {
      parsed.doDate = `Tomorrow${timeString}`;
      parsed.title = parsed.title.replace(/tomorrow/i, '').trim();
    } else if (workingInput.includes('today')) {
      parsed.doDate = `Today${timeString}`;
      parsed.title = parsed.title.replace(/today/i, '').trim();
    } else if (workingInput.includes('monday')) {
      parsed.doDate = `Monday${timeString}`;
      parsed.title = parsed.title.replace(/monday/i, '').trim();
    } else if (workingInput.includes('tuesday')) {
      parsed.doDate = `Tuesday${timeString}`;
      parsed.title = parsed.title.replace(/tuesday/i, '').trim();
    } else if (workingInput.includes('wednesday')) {
      parsed.doDate = `Wednesday${timeString}`;
      parsed.title = parsed.title.replace(/wednesday/i, '').trim();
    } else if (workingInput.includes('thursday')) {
      parsed.doDate = `Thursday${timeString}`;
      parsed.title = parsed.title.replace(/thursday/i, '').trim();
    } else if (workingInput.includes('friday')) {
      parsed.doDate = `Friday${timeString}`;
      parsed.title = parsed.title.replace(/friday/i, '').trim();
    } else if (workingInput.includes('saturday')) {
      parsed.doDate = `Saturday${timeString}`;
      parsed.title = parsed.title.replace(/saturday/i, '').trim();
    } else if (workingInput.includes('sunday')) {
      parsed.doDate = `Sunday${timeString}`;
      parsed.title = parsed.title.replace(/sunday/i, '').trim();
    } else if (workingInput.includes('next week')) {
      parsed.doDate = `Next Week${timeString}`;
      parsed.title = parsed.title.replace(/next week/i, '').trim();
    } else if (timeString) {
      // If only time is specified, assume today
      parsed.doDate = `Today${timeString}`;
    }

    // Remove time patterns from title
    if (timeMatch) {
      parsed.title = parsed.title.replace(/\b\d{1,2}:?\d{0,2}\s*(am|pm|a\.m\.|p\.m\.)?\b/i, '').trim();
    }

    // Remove common time/date prepositions
    parsed.title = parsed.title.replace(/\b(at|on|by)\b/gi, '').trim();

    // Extract @person
    const personMatch = input.match(/@(\w+)/);
    if (personMatch) {
      parsed.person = personMatch[1].charAt(0).toUpperCase() + personMatch[1].slice(1);
      parsed.title = parsed.title.replace(/@\w+/, '').trim();
    }

    // Extract #case
    const caseMatch = input.match(/#(\w+)/);
    if (caseMatch) {
      parsed.case = caseMatch[1].charAt(0).toUpperCase() + caseMatch[1].slice(1);
      parsed.title = parsed.title.replace(/#\w+/, '').trim();
    }

    // Extract priority
    if (input.includes('!deadline')) {
      parsed.priority = "DEADLINE";
      parsed.title = parsed.title.replace(/!deadline/i, '').trim();
    } else if (input.includes('!p1')) {
      parsed.priority = "P1";
      parsed.title = parsed.title.replace(/!p1/i, '').trim();
    } else if (input.includes('!p2')) {
      parsed.priority = "P2";
      parsed.title = parsed.title.replace(/!p2/i, '').trim();
    } else if (input.includes('!quick')) {
      parsed.priority = "QUICK";
      parsed.title = parsed.title.replace(/!quick/i, '').trim();
    } else if (input.includes('!personal')) {
      parsed.priority = "PERSONAL";
      parsed.title = parsed.title.replace(/!personal/i, '').trim();
    }

    // Detect task type from keywords
    if (workingInput.includes('call') || workingInput.includes('phone')) {
      parsed.type = "call";
    } else if (workingInput.includes('meeting') || workingInput.includes('meet')) {
      parsed.type = "meeting";
    } else if (workingInput.includes('deposition') || workingInput.includes('depo')) {
      parsed.type = "deposition";
    } else if (workingInput.includes('hearing') || workingInput.includes('court')) {
      parsed.type = "hearing";
    }

    // Clean up title (remove extra spaces)
    parsed.title = parsed.title.replace(/\s+/g, ' ').trim();

    return parsed;
  };

  const handleInlineEdit = (taskId, field, value) => {
    // Check for @ or # triggers
    if (field === 'case' && value.includes('#')) {
      setAutocompleteType('case');
      setSearchValue(value.replace('#', ''));
      setShowAutocomplete(true);
      setSelectedIndex(0);
    } else if (field === 'person' && value.includes('@')) {
      setAutocompleteType('person');
      setSearchValue(value.replace('@', ''));
      setShowAutocomplete(true);
      setSelectedIndex(0);
    } else {
      setShowAutocomplete(false);
    }

    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ));
  };

  const handleAutocompleteSelect = (item) => {
    const field = autocompleteType === 'case' ? 'case' : 'person';
    const value = item.name;
    
    setTasks(tasks.map(task => 
      task.id === editingTaskId ? { ...task, [field]: value } : task
    ));
    
    setShowAutocomplete(false);
    setEditingTaskId(null);
    setSearchValue('');
  };

  // Filter results based on search
  const getFilteredResults = () => {
    const search = searchValue.toLowerCase();
    if (autocompleteType === 'case') {
      return cases.filter(c => 
        c.name.toLowerCase().includes(search) || 
        c.client.toLowerCase().includes(search)
      );
    } else {
      return people.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.role.toLowerCase().includes(search)
      );
    }
  };

  const filteredResults = showAutocomplete ? getFilteredResults() : [];

  const handleQuickAdd = () => {
    if (parsedTask) {
      const newTask = {
        id: tasks.length + 1,
        ...parsedTask
      };
      setTasks([newTask, ...tasks]);
      setQuickEntry('');
      setShowQuickEntry(false);
      setParsedTask(null);
    }
  };

  const handleQuickEdit = (taskId, field) => {
    setEditingTaskId(taskId);
    setEditingField(field);
  };

  const handleTaskComplete = (taskId, completed) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed } : task
    ));
  };

  // Drag and drop handlers for calendar
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    if (draggedTask) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let newDoDate = '';
      
      // Determine the new doDate string based on the target date
      if (targetDate.toDateString() === today.toDateString()) {
        newDoDate = 'Today';
      } else if (targetDate.toDateString() === tomorrow.toDateString()) {
        newDoDate = 'Tomorrow';
      } else {
        newDoDate = dayNames[targetDate.getDay()];
      }
      
      // Preserve time if it exists
      const timeMatch = draggedTask.doDate.match(/(\d{1,2}:\d{2}\s*(AM|PM))/i);
      if (timeMatch) {
        newDoDate += ` ${timeMatch[1]}`;
      }
      
      setTasks(tasks.map(task => 
        task.id === draggedTask.id ? { ...task, doDate: newDoDate } : task
      ));
      
      setDraggedTask(null);
    }
  };

  // Parse task date string to Date object
  const parseTaskDate = (doDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!doDate || doDate.toLowerCase().includes('today')) return today;
    
    if (doDate.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    
    // Handle day names
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayMatch = dayNames.find(day => doDate.toLowerCase().includes(day));
    if (dayMatch) {
      const targetDay = dayNames.indexOf(dayMatch);
      const currentDay = today.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
      return targetDate;
    }
    
    // Default to today if can't parse
    return today;
  };

  // View filtering logic
  const getFilteredTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeekEnd = new Date(today);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

    switch (currentView) {
      case 'Today':
        return tasks.filter(task => {
          if (task.completed) return false;
          const taskDate = parseTaskDate(task.doDate);
          return taskDate <= today;
        });
      
      case 'This Week':
        return tasks.filter(task => {
          if (task.completed) return false;
          const taskDate = parseTaskDate(task.doDate);
          return taskDate >= today && taskDate <= nextWeekEnd;
        });
      
      case 'All':
        return tasks.filter(task => !task.completed);
      
      case 'Done':
        return tasks.filter(task => task.completed);
      
      case 'Calendar':
        return tasks.filter(task => !task.completed);
      
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  const priorityStyles = {
    'DEADLINE': 'bg-red-500/20 text-red-400 border-red-500/30',
    'P1': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'P2': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'QUICK': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'SOMEDAY': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'PERSONAL': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  };

  const typeIcons = {
    'call': '📞',
    'meeting': '📅',
    'deposition': '📝',
    'task': '✓',
    'hearing': '⚖️'
  };

  useEffect(() => {
    if (quickEntry.length > 3) {
      const parsed = parseNaturalLanguage(quickEntry);
      setParsedTask(parsed);
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }
  }, [quickEntry]);

  // Keyboard shortcut for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        setShowQuickEntry(true);
      }
      if (e.key === 'Escape' && showQuickEntry) {
        setShowQuickEntry(false);
        setQuickEntry('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showQuickEntry]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Command Bar */}
      <div className="border-b border-gray-800/50 backdrop-blur-xl bg-gray-900/50 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Life OS</h1>
            <button
              onClick={() => setShowQuickEntry(!showQuickEntry)}
              className="flex items-center space-x-2 px-4 py-1.5 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all font-medium text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
              <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 rounded font-mono">⌘K</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Natural Language Entry Modal */}
      {showQuickEntry && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">What needs to be done?</h3>
                <button onClick={() => setShowQuickEntry(false)} className="text-gray-500 hover:text-gray-300">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <input
                type="text"
                value={quickEntry}
                onChange={(e) => setQuickEntry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickAdd();
                  if (e.key === 'Escape') {
                    setShowQuickEntry(false);
                    setQuickEntry('');
                  }
                }}
                placeholder='Try: "Call @person at 12pm tomorrow #case" or "Meeting !deadline"'
                className="w-full px-4 py-3 text-lg bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-gray-600 transition-all placeholder-gray-500"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* View Navigation */}
        <div className="mb-8">
          <div className="flex items-center space-x-1 mb-4">
            {['Today', 'Calendar', 'This Week', 'All', 'Done'].map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentView === view
                    ? 'bg-white text-gray-900'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {currentView === 'Today' && 'Today\'s Focus'}
                {currentView === 'Calendar' && 'Calendar'}
                {currentView === 'This Week' && 'This Week'}
                {currentView === 'All' && 'All Tasks'}
                {currentView === 'Done' && 'Completed Tasks'}
              </h2>
              <p className="text-gray-500 mt-1">
                {currentView === 'Today' && `${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • ${filteredTasks.length} tasks`}
                {currentView === 'Calendar' && `${currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                {currentView === 'Next Week' && `${filteredTasks.length} tasks in the next 7 days`}
                {currentView === 'All' && `${filteredTasks.length} active tasks`}
                {currentView === 'Done' && `${filteredTasks.length} completed tasks`}
              </p>
            </div>
            
            {currentView === 'Calendar' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const prev = new Date(currentMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentMonth(prev);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                >
                  ←
                </button>
                <button
                  onClick={() => {
                    const next = new Date(currentMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentMonth(next);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Calendar View */}
        {currentView === 'Calendar' ? (
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 border-b border-gray-800/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-400 border-r border-gray-800/50 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {(() => {
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const startDate = new Date(firstDay);
                startDate.setDate(startDate.getDate() - firstDay.getDay());
                
                const days = [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                for (let i = 0; i < 42; i++) {
                  const date = new Date(startDate);
                  date.setDate(startDate.getDate() + i);
                  
                  const isCurrentMonth = date.getMonth() === month;
                  const isToday = date.getTime() === today.getTime();
                  
                  // Get tasks for this date
                  const dayTasks = filteredTasks.filter(task => {
                    const taskDate = parseTaskDate(task.doDate);
                    return taskDate.getTime() === date.getTime();
                  });
                  
                  days.push(
                    <div
                      key={i}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, date)}
                      className={`min-h-[120px] p-2 border-r border-b border-gray-800/50 last:border-r-0 ${
                        isCurrentMonth ? 'bg-gray-900/30' : 'bg-gray-800/20'
                      } ${isToday ? 'bg-blue-500/10 border-blue-500/30' : ''} ${
                        draggedTask ? 'hover:bg-blue-500/20 transition-colors' : ''
                      }`}
                    >
                      <div className={`text-sm font-medium mb-2 ${
                        isCurrentMonth 
                          ? isToday 
                            ? 'text-blue-400' 
                            : 'text-gray-300'
                          : 'text-gray-600'
                      }`}>
                        {date.getDate()}
                      </div>
                      
                      {/* Tasks for this day */}
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map(task => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task)}
                            onDoubleClick={() => setSelectedTask(task)}
                            className={`text-xs p-1.5 rounded cursor-move hover:opacity-80 transition-opacity ${priorityStyles[task.priority]} border-l-2 border-current`}
                          >
                            <div className="font-medium truncate">{task.title}</div>
                            {task.doDate.includes(':') && (
                              <div className="text-xs opacity-75 mt-0.5">
                                {task.doDate.split(' ').slice(-2).join(' ')}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-gray-500 px-1.5">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                
                return days;
              })()}
            </div>
          </div>
        ) : (
          /* Task List View */
          <div className="grid gap-3">
            {filteredTasks.map(task => (
            <div 
              key={task.id} 
              className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:bg-gray-800/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <input 
                    type="checkbox" 
                    checked={task.completed || false}
                    onChange={(e) => handleTaskComplete(task.id, e.target.checked)}
                    className="h-5 w-5 rounded border-gray-600 bg-gray-800 text-white focus:ring-white/20" 
                  />
                  <span className="text-xl">{typeIcons[task.type]}</span>
                  
                  {/* Inline editable title */}
                  <div className="flex-1">
                    {editingTaskId === task.id && editingField === 'title' ? (
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => handleInlineEdit(task.id, 'title', e.target.value)}
                        onBlur={() => {
                          setEditingTaskId(null);
                          setEditingField(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') {
                            setEditingTaskId(null);
                            setEditingField(null);
                          }
                        }}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                        autoFocus
                      />
                    ) : (
                      <p 
                        className="font-medium text-white text-lg hover:text-gray-300 transition-colors cursor-pointer"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleQuickEdit(task.id, 'title');
                        }}
                      >
                        {task.title}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-2">
                      {/* Priority badge */}
                      <span 
                        className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 ${priorityStyles[task.priority]}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const priorities = ['DEADLINE', 'P1', 'P2', 'QUICK', 'SOMEDAY', 'PERSONAL'];
                          const currentIndex = priorities.indexOf(task.priority);
                          const nextIndex = (currentIndex + 1) % priorities.length;
                          handleInlineEdit(task.id, 'priority', priorities[nextIndex]);
                        }}
                      >
                        {task.priority}
                      </span>
                      
                      {/* Do Date */}
                      {editingTaskId === task.id && editingField === 'doDate' ? (
                        <input
                          type="text"
                          value={task.doDate}
                          onChange={(e) => handleInlineEdit(task.id, 'doDate', e.target.value)}
                          onBlur={() => {
                            setEditingTaskId(null);
                            setEditingField(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              setEditingTaskId(null);
                              setEditingField(null);
                            }
                          }}
                          className="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-sm"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="text-sm text-gray-400 flex items-center cursor-pointer hover:text-white"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleQuickEdit(task.id, 'doDate');
                          }}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {task.doDate}
                        </span>
                      )}

                      {/* Case with Autocomplete */}
                      {editingTaskId === task.id && editingField === 'case' ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={task.case || ''}
                            onChange={(e) => handleInlineEdit(task.id, 'case', e.target.value)}
                            onBlur={() => {
                              setTimeout(() => {
                                setEditingTaskId(null);
                                setShowAutocomplete(false);
                              }, 200);
                            }}
                            onKeyDown={(e) => {
                              if (showAutocomplete && filteredResults.length > 0) {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setSelectedIndex(Math.min(selectedIndex + 1, filteredResults.length - 1));
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setSelectedIndex(Math.max(selectedIndex - 1, 0));
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAutocompleteSelect(filteredResults[selectedIndex]);
                                }
                              } else if (e.key === 'Escape') {
                                setEditingTaskId(null);
                                setShowAutocomplete(false);
                              }
                            }}
                            placeholder="Type # to search cases..."
                            className="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-sm text-purple-400 w-40"
                            autoFocus
                          />
                          
                          {/* Case Autocomplete Dropdown */}
                          {showAutocomplete && autocompleteType === 'case' && filteredResults.length > 0 && (
                            <div className="absolute top-full mt-1 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                              <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-700">
                                Select case or press Enter
                              </div>
                              {filteredResults.slice(0, 5).map((caseItem, idx) => (
                                <button
                                  key={caseItem.id}
                                  onClick={() => handleAutocompleteSelect(caseItem)}
                                  className={`w-full px-3 py-3 text-left hover:bg-gray-700 transition-colors ${
                                    idx === selectedIndex ? 'bg-gray-700' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-medium text-purple-400">{caseItem.name}</p>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {caseItem.client} • {caseItem.status}
                                      </p>
                                    </div>
                                    <span className="text-sm text-emerald-400">{caseItem.value}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : task.case ? (
                        <span 
                          className="text-sm text-purple-400 flex items-center cursor-pointer hover:bg-purple-500/20 px-2 py-0.5 rounded transition-all"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleQuickEdit(task.id, 'case');
                          }}
                        >
                          <Briefcase className="h-3 w-3 mr-1" />
                          {task.case}
                        </span>
                      ) : (
                        <button 
                          className="text-sm text-gray-500 flex items-center cursor-pointer hover:bg-purple-500/10 hover:text-purple-400 px-2 py-0.5 rounded transition-all border border-gray-600/50 border-dashed"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickEdit(task.id, 'case');
                          }}
                        >
                          <Briefcase className="h-3 w-3 mr-1" />
                          Add case
                        </button>
                      )}

                      {/* Person with Autocomplete */}
                      {editingTaskId === task.id && editingField === 'person' ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={task.person || ''}
                            onChange={(e) => handleInlineEdit(task.id, 'person', e.target.value)}
                            onBlur={() => {
                              setTimeout(() => {
                                setEditingTaskId(null);
                                setShowAutocomplete(false);
                              }, 200);
                            }}
                            onKeyDown={(e) => {
                              if (showAutocomplete && filteredResults.length > 0) {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setSelectedIndex(Math.min(selectedIndex + 1, filteredResults.length - 1));
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setSelectedIndex(Math.max(selectedIndex - 1, 0));
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAutocompleteSelect(filteredResults[selectedIndex]);
                                }
                              } else if (e.key === 'Escape') {
                                setEditingTaskId(null);
                                setShowAutocomplete(false);
                              }
                            }}
                            placeholder="Type @ to search people..."
                            className="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-sm text-blue-400 w-40"
                            autoFocus
                          />
                          
                          {/* Person Autocomplete Dropdown */}
                          {showAutocomplete && autocompleteType === 'person' && filteredResults.length > 0 && (
                            <div className="absolute top-full mt-1 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                              <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-700">
                                Select person or press Enter
                              </div>
                              {filteredResults.slice(0, 5).map((person, idx) => (
                                <button
                                  key={person.id}
                                  onClick={() => handleAutocompleteSelect(person)}
                                  className={`w-full px-3 py-3 text-left hover:bg-gray-700 transition-colors ${
                                    idx === selectedIndex ? 'bg-gray-700' : ''
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-medium">
                                      {person.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-blue-400">{person.name}</p>
                                      <p className="text-xs text-gray-400">
                                        {person.role} • {person.phone}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : task.person ? (
                        <span 
                          className="text-sm text-blue-400 flex items-center cursor-pointer hover:bg-blue-500/20 px-2 py-0.5 rounded transition-all"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleQuickEdit(task.id, 'person');
                          }}
                        >
                          <User className="h-3 w-3 mr-1" />
                          {task.person}
                        </span>
                      ) : (
                        <button 
                          className="text-sm text-gray-500 flex items-center cursor-pointer hover:bg-blue-500/10 hover:text-blue-400 px-2 py-0.5 rounded transition-all border border-gray-600/50 border-dashed"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickEdit(task.id, 'person');
                          }}
                        >
                          <User className="h-3 w-3 mr-1" />
                          Add person
                        </button>
                      )}
                      
                      {task.deadline && (
                        <span className="text-sm text-red-400 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Deadline: {task.deadline}
                        </span>
                      )}
                    </div>
                    
                    {/* Show notes on hover */}
                    {task.notes && (
                      <p className="text-sm text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(task);
                    }}
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTaskMenu(showTaskMenu === task.id ? null : task.id);
                      }}
                      className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showTaskMenu === task.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 py-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setTasks(tasks.map(t => 
                              t.id === task.id ? { ...t, priority: 'DEADLINE' } : t
                            ));
                            setShowTaskMenu(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <Flag className="h-4 w-4" />
                          <span>Mark as Important</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newTask = {
                              ...task,
                              id: tasks.length + 1,
                              title: `${task.title} (Copy)`
                            };
                            setTasks([newTask, ...tasks]);
                            setShowTaskMenu(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <Copy className="h-4 w-4" />
                          <span>Duplicate Task</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setTasks(tasks.map(t => 
                              t.id === task.id ? { ...t, archived: true } : t
                            ));
                            setShowTaskMenu(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <Archive className="h-4 w-4" />
                          <span>Archive</span>
                        </button>
                        <hr className="border-gray-700 my-1" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setTasks(tasks.filter(t => t.id !== task.id));
                            setShowTaskMenu(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Task</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {currentView === 'Done' ? 'No completed tasks' : 'No tasks yet'}
              </h3>
              <p className="text-sm">
                {currentView === 'Done' 
                  ? 'Complete some tasks to see them here' 
                  : 'Click "Add Task" above to get started'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Task Details</h3>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                  <input
                    type="text"
                    value={selectedTask.title}
                    onChange={(e) => {
                      const updatedTask = { ...selectedTask, title: e.target.value };
                      setSelectedTask(updatedTask);
                      setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                    }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                    <select
                      value={selectedTask.priority}
                      onChange={(e) => {
                        const updatedTask = { ...selectedTask, priority: e.target.value };
                        setSelectedTask(updatedTask);
                        setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    >
                      <option value="DEADLINE">DEADLINE</option>
                      <option value="P1">P1</option>
                      <option value="P2">P2</option>
                      <option value="QUICK">QUICK</option>
                      <option value="SOMEDAY">SOMEDAY</option>
                      <option value="PERSONAL">PERSONAL</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
                    <select
                      value={selectedTask.type}
                      onChange={(e) => {
                        const updatedTask = { ...selectedTask, type: e.target.value };
                        setSelectedTask(updatedTask);
                        setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    >
                      <option value="task">Task</option>
                      <option value="call">Call</option>
                      <option value="meeting">Meeting</option>
                      <option value="deposition">Deposition</option>
                      <option value="hearing">Hearing</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Do Date</label>
                  <input
                    type="text"
                    value={selectedTask.doDate}
                    onChange={(e) => {
                      const updatedTask = { ...selectedTask, doDate: e.target.value };
                      setSelectedTask(updatedTask);
                      setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                    }}
                    placeholder="e.g., Today, Tomorrow 2:00 PM, Friday"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Case</label>
                    <input
                      type="text"
                      value={selectedTask.case || ''}
                      onChange={(e) => {
                        const updatedTask = { ...selectedTask, case: e.target.value };
                        setSelectedTask(updatedTask);
                        setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                      }}
                      placeholder="Case name"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Person</label>
                    <input
                      type="text"
                      value={selectedTask.person || ''}
                      onChange={(e) => {
                        const updatedTask = { ...selectedTask, person: e.target.value };
                        setSelectedTask(updatedTask);
                        setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                      }}
                      placeholder="Person name"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
                  <textarea
                    value={selectedTask.notes || ''}
                    onChange={(e) => {
                      const updatedTask = { ...selectedTask, notes: e.target.value };
                      setSelectedTask(updatedTask);
                      setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                    }}
                    placeholder="Additional notes..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                    }}
                    className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
