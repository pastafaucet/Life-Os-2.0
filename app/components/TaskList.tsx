'use client';

import React from 'react';
import { Task, Case, Person } from '@/lib/storage/types';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  onTaskDelete: (id: string) => void;
  cases: Case[];
  people: Person[];
}

export default function TaskList({ tasks, onTaskUpdate, onTaskDelete, cases, people }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No tasks for today</p>
        <p className="text-gray-600 text-sm mt-2">Press ⌘K to add your first task</p>
      </div>
    );
  }

  // Group tasks by priority for better organization
  const priorityOrder: Task['priority'][] = ['DEADLINE', 'P1', 'P2', 'QUICK', 'SOMEDAY'];
  const groupedTasks = priorityOrder.reduce((acc, priority) => {
    const tasksForPriority = tasks.filter(task => task.priority === priority && !task.completed);
    if (tasksForPriority.length > 0) {
      acc[priority] = tasksForPriority;
    }
    return acc;
  }, {} as Record<Task['priority'], Task[]>);

  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="space-y-6">
      {/* Active Tasks by Priority */}
      {Object.entries(groupedTasks).map(([priority, priorityTasks]) => (
        <div key={priority} className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            {priority} ({priorityTasks.length})
          </h3>
          <div className="space-y-2">
            {priorityTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
                cases={cases}
                people={people}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Completed ({completedTasks.length})
          </h3>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
                cases={cases}
                people={people}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
