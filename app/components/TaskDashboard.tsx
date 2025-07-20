'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Clock, User, Briefcase, Hash, AlertTriangle, 
  Zap, Brain, CheckCircle, ArrowRight, X, MoreHorizontal,
  Edit3, Trash2, Copy, Flag, Archive, ChevronDown, Save
} from 'lucide-react';
import { estimateTaskTime } from '../../openai';

interface Task {
  id: number;
  title: string;
  doDate: string;
  priority?: string;
  status: 'inbox' | 'active' | 'someday' | 'scheduled' | 'pinned' | 'today';
  type: string;
  person?: string;
  case?: string;
  timeEstimate?: string;
  deadline?: string;
  notes?: string;
  completed?: boolean;
  archived?: boolean;
}

interface ParsedTask {
  title: string;
  doDate: string;
  priority?: string;
  status: 'inbox' | 'active' | 'someday' | 'scheduled' | 'pinned' | 'today';
  type: string;
  person?: string;
  case?: string;
  timeEstimate?: string;
}

interface CaseItem {
  id: number;
  name: string;
  client: string;
  status: string;
  value: string;
}

interface PersonItem {
  id: number;
  name: string;
  role: string;
  phone: string;
}

export default function TaskDashboard() {
  const [quickEntry, setQuickEntry] = useState('');
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showTaskMenu, setShowTaskMenu] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteType, setAutocompleteType] = useState<'case' | 'person' | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // View navigation state
  const [currentView, setCurrentView] = useState('Today');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // AI status state
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiStatusLoaded, setAiStatusLoaded] = useState(false);

  // Data arrays - will be populated from localStorage or user input
  const cases: CaseItem[] = [];
  const people: PersonItem[] = [];
  const [tasks, setTasks] = useState<Task[]>([]);

  // Check if AI is properly configured
  const hasValidApiKey = () => {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    return !!(apiKey && apiKey !== 'your-openai-api-key-here' && apiKey.length > 20);
  };

  // Toggle AI enabled/disabled
  const toggleAI = () => {
    const newState = !aiEnabled;
    setAiEnabled(newState);
    localStorage.setItem('aiEnabled', JSON.stringify(newState));
  };

  // Natural language parser
  const parseNaturalLanguage = (input: string): ParsedTask => {
    const parsed: ParsedTask = {
      title: input,
      doDate: "Today",
      priority: "",
      status: "inbox",
      type: "task"
    };

    // Work with a copy of the input for processing
    let workingTitle = input;
    let workingInput = input.toLowerCase();
    let extractedDateTime = null;

    console.log('DEBUG: Starting parse of input:', input);

    // Priority keywords that should NOT be treated as cases
    const priorityKeywords = ['deadline', 'overdue', 'personal', 'today', 'active', 'someday', 'scheduled', 'pinned', 'inbox'];
    
    // Extract cases FIRST - support both # and ! syntax, but exclude priority keywords
    const casePattern = /[#!]([a-zA-Z0-9_-]+)/g;
    const caseMatches = input.match(casePattern);
    
    if (caseMatches) {
      console.log('DEBUG: Found potential case matches:', caseMatches);
      
      for (const match of caseMatches) {
        const caseName = match.substring(1); // Remove # or !
        console.log('DEBUG: Checking case candidate:', caseName);
        
        // Only treat as case if it's NOT a priority keyword
        if (!priorityKeywords.includes(caseName.toLowerCase())) {
          parsed.case = caseName;
          console.log('DEBUG: Case extracted:', caseName, 'from pattern:', match);
          
          // Remove ONLY the exact matched string from both working copies
          workingTitle = input.replace(match, '').trim();
          workingInput = workingTitle.toLowerCase();
          console.log('DEBUG: Working title after case removal:', workingTitle);
          break; // Take the first valid case
        } else {
          console.log('DEBUG: Skipping', caseName, 'because it is a priority keyword');
        }
      }
    }

    // Extract specific date formats first (MM/DD/YYYY, MM/DD/YY, etc.)
    const dateFormats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
      /(\d{1,2})\/(\d{1,2})\/(\d{2})/,  // MM/DD/YY
      /(\d{1,2})-(\d{1,2})-(\d{4})/,   // MM-DD-YYYY
      /(\d{1,2})-(\d{1,2})-(\d{2})/    // MM-DD-YY
    ];
    
    let specificDateFound = false;
    for (const dateFormat of dateFormats) {
      const dateMatch = workingTitle.match(dateFormat);
      if (dateMatch) {
        const month = parseInt(dateMatch[1]);
        const day = parseInt(dateMatch[2]);
        let year = parseInt(dateMatch[3]);
        
        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        
        // Create date string
        const date = new Date(year, month - 1, day);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
          parsed.doDate = 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
          parsed.doDate = 'Tomorrow';
        } else {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          parsed.doDate = `${monthNames[month - 1]} ${day}, ${year}`;
        }
        
        // Remove the date from the working title
        workingTitle = workingTitle.replace(dateMatch[0], '').trim();
        specificDateFound = true;
        break;
      }
    }

    // Match time patterns (12:30 pm, 2:00, 3pm, etc.) - always extract time
    const timeMatch = workingInput.match(/\b(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)\b|\b(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)\b/);
    let timeString = '';
    if (timeMatch) {
      let hour, minute;
      if (timeMatch[1] && timeMatch[2]) {
        // Format: 12:30 pm
        hour = parseInt(timeMatch[1]);
        minute = timeMatch[2];
      } else {
        // Format: 3 pm
        hour = parseInt(timeMatch[4]);
        minute = '00';
      }
      
      const period = timeMatch[3] || timeMatch[5] || '';
      
      // Convert to readable format
      if (period.includes('p') && hour < 12) hour += 12;
      if (period.includes('a') && hour === 12) hour = 0;
      
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      const displayPeriod = hour >= 12 ? 'PM' : 'AM';
      timeString = ` ${displayHour}:${minute} ${displayPeriod}`;
      
      // If specific date was found, append time to that date
      if (specificDateFound) {
        parsed.doDate = parsed.doDate + timeString;
      }
    }

    // Extract @person first (keep name in title, just remove @)
    const personMatch = workingTitle.match(/@(\w+)/);
    if (personMatch) {
      parsed.person = personMatch[1].charAt(0).toUpperCase() + personMatch[1].slice(1);
      workingTitle = workingTitle.replace(/@(\w+)/g, '$1').trim();
    }


    // Extract priority keywords (case-insensitive with regex) - use workingTitle 
    if (/!deadline\b/i.test(workingTitle)) {
      parsed.priority = "DEADLINE";
      workingTitle = workingTitle.replace(/!deadline\b/i, '').trim();
    } else if (/!overdue\b/i.test(workingTitle)) {
      parsed.priority = "OVERDUE";
      workingTitle = workingTitle.replace(/!overdue\b/i, '').trim();
    } else if (/!personal\b/i.test(workingTitle)) {
      parsed.priority = "PERSONAL";
      workingTitle = workingTitle.replace(/!personal\b/i, '').trim();
    }

    // Extract status keywords (case-insensitive with regex) - use workingTitle
    if (/!today\b/i.test(workingTitle)) {
      parsed.status = "today";
      workingTitle = workingTitle.replace(/!today\b/i, '').trim();
    } else if (/!active\b/i.test(workingTitle)) {
      parsed.status = "active";
      workingTitle = workingTitle.replace(/!active\b/i, '').trim();
    } else if (/!someday\b/i.test(workingTitle)) {
      parsed.status = "someday";
      workingTitle = workingTitle.replace(/!someday\b/i, '').trim();
    } else if (/!scheduled\b/i.test(workingTitle)) {
      parsed.status = "scheduled";
      workingTitle = workingTitle.replace(/!scheduled\b/i, '').trim();
    } else if (/!pinned\b/i.test(workingTitle)) {
      parsed.status = "pinned";
      workingTitle = workingTitle.replace(/!pinned\b/i, '').trim();
    } else if (/!inbox\b/i.test(workingTitle)) {
      parsed.status = "inbox";
      workingTitle = workingTitle.replace(/!inbox\b/i, '').trim();
    }

    // Only set relative dates if no specific date was found
    if (!specificDateFound) {
      if (workingInput.includes('tomorrow')) {
        parsed.doDate = `Tomorrow${timeString}`;
        workingTitle = workingTitle.replace(/\btomorrow\b/i, '');
      } else if (workingInput.includes('today')) {
        parsed.doDate = `Today${timeString}`;
        workingTitle = workingTitle.replace(/\btoday\b/i, '');
      } else if (workingInput.includes('monday')) {
        parsed.doDate = `Monday${timeString}`;
        workingTitle = workingTitle.replace(/\bmonday\b/i, '');
      } else if (workingInput.includes('tuesday')) {
        parsed.doDate = `Tuesday${timeString}`;
        workingTitle = workingTitle.replace(/\btuesday\b/i, '');
      } else if (workingInput.includes('wednesday')) {
        parsed.doDate = `Wednesday${timeString}`;
        workingTitle = workingTitle.replace(/\bwednesday\b/i, '');
      } else if (workingInput.includes('thursday')) {
        parsed.doDate = `Thursday${timeString}`;
        workingTitle = workingTitle.replace(/\bthursday\b/i, '');
      } else if (workingInput.includes('friday')) {
        parsed.doDate = `Friday${timeString}`;
        workingTitle = workingTitle.replace(/\bfriday\b/i, '');
      } else if (workingInput.includes('saturday')) {
        parsed.doDate = `Saturday${timeString}`;
        workingTitle = workingTitle.replace(/\bsaturday\b/i, '');
      } else if (workingInput.includes('sunday')) {
        parsed.doDate = `Sunday${timeString}`;
        workingTitle = workingTitle.replace(/\bsunday\b/i, '');
      } else if (workingInput.includes('next week')) {
        parsed.doDate = `Next Week${timeString}`;
        workingTitle = workingTitle.replace(/\bnext week\b/i, '');
      } else if (timeString && !specificDateFound) {
        // If only time is specified, assume today
        parsed.doDate = `Today${timeString}`;
      }
    }

    // Remove time patterns from title (always remove if found)
    if (timeMatch) {
      workingTitle = workingTitle.replace(/\b\d{1,2}:\d{2}\s*(am|pm|a\.m\.|p\.m\.)\b|\b\d{1,2}\s*(am|pm|a\.m\.|p\.m\.)\b/i, '');
    }

    // Remove common time/date prepositions
    workingTitle = workingTitle.replace(/\b(at|on|by)\b/gi, '');

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

    // Clean up title (remove extra spaces) and set final result
    parsed.title = workingTitle.replace(/\s+/g, ' ').trim();

    console.log('DEBUG: Final parsed result:', parsed);
    return parsed;
  };

  const handleInlineEdit = (taskId: number, field: string, value: string) => {
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

  const handleAutocompleteSelect = (item: CaseItem | PersonItem) => {
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

  const handleQuickEdit = (taskId: number, field: string) => {
    setEditingTaskId(taskId);
    setEditingField(field);
  };

  const handleTaskComplete = (taskId: number, completed: boolean) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed } : task
    ));
  };

  // Drag and drop handlers for calendar
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
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
  const parseTaskDate = (doDate: string): Date => {
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
    switch (currentView) {
      case 'Today':
        return tasks.filter(task => {
          if (task.completed) return false;
          const taskDate = parseTaskDate(task.doDate);
          const today = new Date();
          today.setHours(23, 59, 59, 999); // End of today
          return taskDate <= today;
        });
      
      case 'Inbox':
        return tasks.filter(task => {
          if (task.completed) return false;
          return task.status === 'inbox';
        });
      
      case 'Active':
        return tasks.filter(task => {
          if (task.completed) return false;
          return task.status === 'active';
        });
      
      case 'Someday':
        return tasks.filter(task => {
          if (task.completed) return false;
          return task.status === 'someday';
        });
      
      case 'Scheduled':
        return tasks.filter(task => {
          if (task.completed) return false;
          return task.status === 'scheduled';
        });
      
      case 'Pinned':
        return tasks.filter(task => {
          if (task.completed) return false;
          return task.status === 'pinned';
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

  const priorityStyles: Record<string, string> = {
    'DEADLINE': 'bg-red-500/20 text-red-400 border-red-500/30',
    'OVERDUE': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'PERSONAL': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  };

  const statusStyles: Record<string, string> = {
    'inbox': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'active': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'someday': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    'scheduled': 'bg-green-500/20 text-green-400 border-green-500/30',
    'pinned': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'today': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  };

  const typeIcons: Record<string, string> = {
    'call': '📞',
    'meeting': '📅',
    'deposition': '📝',
    'task': '✓',
    'hearing': '⚖️'
  };

  // Load AI status from localStorage and detect API key
  useEffect(() => {
    const savedAiEnabled = localStorage.getItem('aiEnabled');
    const hasApiKey = hasValidApiKey();
    
    if (savedAiEnabled !== null) {
      setAiEnabled(JSON.parse(savedAiEnabled) && hasApiKey);
    } else {
      setAiEnabled(hasApiKey);
    }
    
    setAiStatusLoaded(true);
  }, []);

  useEffect(() => {
    if (quickEntry.length > 3) {
      const parsed = parseNaturalLanguage(quickEntry);
      
      // Get AI time estimate with toggle consideration
      if (aiEnabled && hasValidApiKey()) {
        estimateTaskTime({
          title: parsed.title,
          type: parsed.type,
          priority: parsed.priority || "",
          case: parsed.case
        }).then(timeEstimate => {
          setParsedTask({ ...parsed, timeEstimate: timeEstimate + ' ✨' });
        }).catch((error) => {
          console.warn('Time estimation failed:', error);
          // Use intelligent fallback instead of generic "2 hours"
          const fallbackTime = parsed.type === 'call' ? '30 min' : 
                             parsed.type === 'meeting' ? '1 hour' :
                             parsed.priority === 'QUICK' ? '30 min' :
                             parsed.priority === 'DEADLINE' ? '3 hours' : '90 min';
          setParsedTask({ ...parsed, timeEstimate: fallbackTime + ' 🧠' });
        });
      } else {
        // Use intelligent fallback when AI is disabled
        const fallbackTime = parsed.type === 'call' ? '30 min' : 
                           parsed.type === 'meeting' ? '1 hour' :
                           parsed.priority === 'QUICK' ? '30 min' :
                           parsed.priority === 'DEADLINE' ? '3 hours' : '90 min';
        setParsedTask({ ...parsed, timeEstimate: fallbackTime + ' 🧠' });
      }
      
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }
  }, [quickEntry, aiEnabled]);

  // Keyboard shortcut for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Life OS</h1>
              
              {/* AI Status Indicator */}
              {aiStatusLoaded && (
                <button
                  onClick={toggleAI}
                  className="group relative flex items-center justify-center"
                  title={aiEnabled ? 'AI: Enabled (Click to disable)' : 'AI: Disabled (Click to enable)'}
                >
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    aiEnabled 
                      ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                      : 'bg-red-500 shadow-lg shadow-red-500/50'
                  } group-hover:scale-110 group-active:scale-95`}>
                    {/* Pulse animation when enabled */}
                    {aiEnabled && (
                      <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
                    )}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {aiEnabled ? 'AI: Enabled' : 'AI: Disabled'}
                  </div>
                </button>
              )}
            </div>
            
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
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
            {['Today', 'Calendar', 'Inbox', 'Active', 'Someday', 'Scheduled', 'Pinned', 'All', 'Done'].map((view) => (
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
                            className={`text-xs p-1.5 rounded cursor-move hover:opacity-80 transition-opacity ${task.priority && priorityStyles[task.priority] ? priorityStyles[task.priority] : 'bg-gray-500/20 text-gray-400 border-gray-500/30'} border-l-2 border-current`}
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
                      {/* Placeholder for future feature - maintaining spacing */}
                      <div className="w-16"></div>
                      
                      {/* Placeholder for future feature - maintaining spacing */}
                      <div className="w-16"></div>
                      
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
                                        {(caseItem as CaseItem).client} • {(caseItem as CaseItem).status}
                                      </p>
                                    </div>
                                    <span className="text-sm text-emerald-400">{(caseItem as CaseItem).value}</span>
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
                                        {(person as PersonItem).role} • {(person as PersonItem).phone}
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
                      
                      {/* Time Estimate with AI indicator */}
                      {editingTaskId === task.id && editingField === 'timeEstimate' ? (
                        <input
                          type="text"
                          value={task.timeEstimate || ''}
                          onChange={(e) => handleInlineEdit(task.id, 'timeEstimate', e.target.value)}
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
                          placeholder="e.g., 2 hours, 30 min"
                          className="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-sm text-emerald-400 w-32"
                          autoFocus
                        />
                      ) : task.timeEstimate ? (
                        <span 
                          className="text-sm text-emerald-400 flex items-center cursor-pointer hover:bg-emerald-500/20 px-2 py-0.5 rounded transition-all"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleQuickEdit(task.id, 'timeEstimate');
                          }}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {task.timeEstimate}
                        </span>
                      ) : (
                        <button 
                          className="text-sm text-gray-500 flex items-center cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-400 px-2 py-0.5 rounded transition-all border border-gray-600/50 border-dashed"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickEdit(task.id, 'timeEstimate');
                          }}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Add time estimate
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
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                    <select
                      value={selectedTask.priority || ''}
                      onChange={(e) => {
                        const updatedTask = { ...selectedTask, priority: e.target.value || undefined };
                        setSelectedTask(updatedTask);
                        setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    >
                      <option value="">No Priority</option>
                      <option value="DEADLINE">DEADLINE</option>
                      <option value="OVERDUE">OVERDUE</option>
                      <option value="PERSONAL">PERSONAL</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                    <select
                      value={selectedTask.status}
                      onChange={(e) => {
                        const updatedTask = { ...selectedTask, status: e.target.value as Task['status'] };
                        setSelectedTask(updatedTask);
                        setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    >
                      <option value="inbox">Inbox</option>
                      <option value="active">Active</option>
                      <option value="someday">Someday</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="pinned">Pinned</option>
                      <option value="today">Today</option>
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
