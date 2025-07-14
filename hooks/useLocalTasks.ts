import { useState, useEffect } from 'react';
import { Task } from '@/lib/storage/types';
import { LocalStorage } from '@/lib/storage/localStorage';

export function useLocalTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tasks on mount
  useEffect(() => {
    LocalStorage.initialize();
    const loadedTasks = LocalStorage.getTasks();
    setTasks(loadedTasks);
    setLoading(false);
  }, []);

  const createTask = (taskData: Partial<Task>) => {
    const newTask = LocalStorage.createTask(taskData);
    setTasks(LocalStorage.getTasks()); // Refresh from storage
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updatedTask = LocalStorage.updateTask(id, updates);
    if (updatedTask) {
      setTasks(LocalStorage.getTasks()); // Refresh from storage
    }
    return updatedTask;
  };

  const deleteTask = (id: string) => {
    const success = LocalStorage.deleteTask(id);
    if (success) {
      setTasks(LocalStorage.getTasks()); // Refresh from storage
    }
    return success;
  };

  const toggleComplete = (id: string) => {
    const task = LocalStorage.getTask(id);
    if (task) {
      return updateTask(id, { completed: !task.completed });
    }
    return null;
  };

  const getTasksByStatus = (completed: boolean) => {
    return tasks.filter(task => task.completed === completed);
  };

  const getTasksByPriority = (priority: Task['priority']) => {
    return tasks.filter(task => task.priority === priority);
  };

  const getTodaysTasks = () => {
    return tasks.filter(task => {
      return task.doDate.includes('Today') || 
             task.doDate.includes('today') ||
             new Date(task.doDate) <= new Date();
    });
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter(task => {
      if (task.deadline) {
        return new Date(task.deadline) < now && !task.completed;
      }
      return false;
    });
  };

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    getTasksByStatus,
    getTasksByPriority,
    getTodaysTasks,
    getOverdueTasks
  };
}
