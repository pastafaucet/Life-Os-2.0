'use client';

import React from 'react';
import Navigation from '../components/Navigation';
import TaskDashboard from '../components/TaskDashboard';

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navigation />
      <TaskDashboard />
    </div>
  );
}
