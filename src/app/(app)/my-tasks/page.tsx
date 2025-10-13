"use client";

import React, { useEffect, useState } from "react";
import { CheckSquare, Plus, Filter, Check, RotateCcw, Trash2, Shield, FileText, Info, ChevronDown, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserStore } from "@/stores/user-store";
import { toastError, toastSuccess } from "@/components/toast-varients";
import { useTasksStore, type Task } from "@/stores/tasks-store";

export default function MyTasksPage() {
  const userData = useUserStore((state) => state.userData);
  const { 
    tasks, 
    isLoading: loading, 
    error, 
    fetchTasks, 
    addTask, 
    updateTask: updateTaskInStore, 
    deleteTask: deleteTaskFromStore,
    searchTasks,
    getTasksByStatus,
    getTasksByPriority,
    getTasksBySource
  } = useTasksStore();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  // Helper to get userId with fallbacks
  const getUserId = (): string | null => {
    if (userData?.userId) return userData.userId;
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('user_id');
      if (storedId) return storedId;
    }
    return process.env.NEXT_PUBLIC_FALLBACK_USER_ID || null;
  };

  // Extract only the suggested fix from mixed descriptions like
  // "<issue details>. Recommended: <fix text>" or "Suggested fix: <fix text>".
  const getSuggestedFix = (text?: string) => {
    if (!text) return "";
    const lower = text.toLowerCase();
    const keys = ["recommended:", "recommendation:", "suggested fix:", "suggestion:"];
    for (const k of keys) {
      const idx = lower.indexOf(k);
      if (idx !== -1) {
        return text.slice(idx + k.length).trim();
      }
    }
    // Fallback: if no marker found, return the original text
    return text;
  };
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskSource, setNewTaskSource] = useState<"manual" | "compliance" | "contract">("manual");

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // status
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoTask, setInfoTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const loadTasks = async (force = false) => {
    const userId = getUserId();
    
    if (!userId) {
      console.error('❌ Cannot load tasks: userId is null');
      return; // Don't show error toast, just wait for user to be initialized
    }

    await fetchTasks(userId, force);
  };

  useEffect(() => {
    // Only load tasks when we have userData
    if (userData?.userId) {
      loadTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.userId, activeTab, priorityFilter, sourceFilter]);

  // Close filters dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showFilters && !target.closest('.filter-container')) {
        setShowFilters(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm.trim() ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = activeTab === 'all' || task.status === activeTab;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesSource = sourceFilter === 'all' || task.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesSource;
  });

  const getSourceStyle = (source?: string) => {
    switch (source) {
      case "compliance": return { bar: "border-l-8 border-blue-500", pill: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", icon: <Shield className="h-3.5 w-3.5" /> };
      case "contract": return { bar: "border-l-8 border-purple-500", pill: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300", icon: <FileText className="h-3.5 w-3.5" /> };
      default: return { bar: "border-l-8 border-gray-400", pill: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300", icon: <CheckSquare className="h-3.5 w-3.5" /> };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "medium": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const createTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    try {
      const userId = getUserId();
      
      if (!userId) {
        console.error('❌ Cannot create task: userId is null');
        toastError('Create Failed', 'User ID not found. Please log in again.');
        return;
      }

      console.log('➕ Creating task for userId:', userId);
      
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: newTaskDescription.trim(),
          status: 'pending',
          priority: 'medium',
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          category: 'General',
          source: newTaskSource,
          userId
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create task');
      
      // Add to store for instant UI update
      if (data.task) {
        addTask(data.task);
        toastSuccess('Task Created', 'New task added successfully!');
      }
      
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskSource('manual');
      setShowNewTaskForm(false);
    } catch (e) {
      console.error('Create task failed', e);
      toastError('Create Failed', e instanceof Error ? e.message : 'Failed to create task');
    }
  };

  const updateTask = async (task: Task, updates: Partial<Task>) => {
    const id = task._id || task.id;
    if (!id) return;
    
    // Optimistic update
    updateTaskInStore(id, updates);
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update task');
      }
      
      toastSuccess('Task Updated', 'Task updated successfully!');
    } catch (e) {
      console.error('Update task failed', e);
      toastError('Update Failed', e instanceof Error ? e.message : 'Failed to update task');
      // Revert on error by refetching
      await loadTasks(true);
    }
  };

  const deleteTask = async (task: Task) => {
    const id = task._id || task.id;
    if (!id) return;
    
    // Optimistic delete
    deleteTaskFromStore(id);
    
    try {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete task');
      }
      
      toastSuccess('Task Deleted', 'Task removed successfully!');
    } catch (e) {
      console.error('Delete task failed', e);
      toastError('Delete Failed', e instanceof Error ? e.message : 'Failed to delete task');
      // Revert on error by refetching
      await loadTasks(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-8 w-full">
        {/* Compact Header Section */}
        <div className="py-4">
          {/* Single Row Header with Title, Search, Filters, and New Task Button */}
          <div className="flex items-center gap-4">
            {/* Title */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <CheckSquare className="h-6 w-6 text-gray-700" />
              <h1 className="font-h2 text-gray-900">My Tasks</h1>
            </div>
            
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search tasks…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-body-14 placeholder:text-gray-400 rounded-lg border-gray-200 shadow-sm"
              />
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            {/* Simple Filter Buttons */}
            <div className="relative flex items-center gap-2 flex-shrink-0 filter-container">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`rounded-lg border-gray-200 shadow-sm flex items-center gap-2 transition-all duration-200 ${
                  showFilters ? 'bg-teal-50 border-teal-200 text-teal-700' : 'hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              
              {showFilters && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 min-w-[400px] animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-4">
                    {/* Priority Filter */}
                    <div>
                      <label className="font-body-14-medium text-gray-700 mb-3 block">Priority</label>
                      <div className="flex flex-wrap gap-2">
                        {['all', 'critical', 'high', 'medium', 'low'].map((priority) => (
                          <button
                            key={priority}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPriorityFilter(priority);
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
                              priorityFilter === priority
                                ? priority === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                                  priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                  priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                  priority === 'low' ? 'bg-green-100 text-green-700 border-green-200' :
                                  'bg-teal-100 text-teal-700 border-teal-200'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {priority === 'all' ? 'All Priorities' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Source Filter */}
                    <div>
                      <label className="font-body-14-medium text-gray-700 mb-3 block">Source</label>
                      <div className="flex flex-wrap gap-2">
                        {['all', 'compliance', 'contract', 'manual'].map((source) => (
                          <button
                            key={source}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSourceFilter(source);
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
                              sourceFilter === source
                                ? source === 'compliance' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                  source === 'contract' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                  source === 'manual' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                  'bg-teal-100 text-teal-700 border-teal-200'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {source === 'all' ? 'All Sources' : source.charAt(0).toUpperCase() + source.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPriorityFilter('all');
                          setSourceFilter('all');
                        }}
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                      >
                        Clear All
                      </Button>
                      <Button 
                        onClick={() => setShowFilters(false)}
                        size="sm"
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Active Filters Breadcrumb */}
            {(priorityFilter !== 'all' || sourceFilter !== 'all') && (
              <div className="flex items-center gap-2 flex-wrap">
                {priorityFilter !== 'all' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border ${
                    priorityFilter === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                    priorityFilter === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    priorityFilter === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    Priority: {priorityFilter}
                    <button
                      onClick={() => setPriorityFilter('all')}
                      className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}
                {sourceFilter !== 'all' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border ${
                    sourceFilter === 'compliance' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    sourceFilter === 'contract' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    Source: {sourceFilter}
                    <button
                      onClick={() => setSourceFilter('all')}
                      className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
            
            {/* New Task Button */}
            <Button 
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2.5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 flex-shrink-0"
              onClick={() => setShowNewTaskForm(true)}
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>

        {/* New Task Form */}
      {showNewTaskForm && (
        <Card>
          <CardHeader>
            <CardTitle className="font-h3">Create New Task</CardTitle>
            <CardDescription className="font-body-14 text-gray-600">Add a new compliance or contract review task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="taskTitle" className="font-body-14-medium">Task Title</label>
              <Input
                id="taskTitle"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title..."
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="taskDescription" className="font-body-14-medium">Description</label>
              <Input
                id="taskDescription"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Enter task description..."
              />
            </div>
            <div className="grid gap-2">
              <label className="font-body-14-medium">Task Type</label>
              <Select value={newTaskSource} onValueChange={(v: any) => setNewTaskSource(v)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliance">Compliance Gap</SelectItem>
                  <SelectItem value="contract">Contract Review</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={createTask} disabled={!newTaskTitle.trim()}>
                Create Task
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowNewTaskForm(false);
                  setNewTaskTitle("");
                  setNewTaskDescription("");
                  setNewTaskSource('manual');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>

        {/* Content Section */}
        <div className="pb-6 mt-4">
          {/* Task Tabs */}
          <div className="mb-4">
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`w-full sm:w-auto px-6 py-3 font-body-14-medium transition-all duration-200 ${
                  activeTab === 'all'
                    ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                All Tasks ({filteredTasks.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`w-full sm:w-auto px-6 py-3 font-body-14-medium transition-all duration-200 ${
                  activeTab === 'pending'
                    ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Pending ({filteredTasks.filter(t => t.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`w-full sm:w-auto px-6 py-3 font-body-14-medium transition-all duration-200 ${
                  activeTab === 'completed'
                    ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Completed ({filteredTasks.filter(t => t.status === 'completed').length})
              </button>
            </div>

            <div className="space-y-4">
          {loading && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">Loading tasks…</CardContent>
            </Card>
          )}
          {!!error && (
            <Card>
              <CardContent className="py-8 text-center text-red-600">{error}</CardContent>
            </Card>
          )}
          {!loading && !error && filteredTasks.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12">
              <div className="text-center">
                <div className="bg-teal-50 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <CheckSquare className="h-10 w-10 text-teal-600" />
                </div>
                <h3 className="font-h3 text-gray-900 mb-2">No tasks found</h3>
                <p className="font-body-14 text-gray-600 mb-4">
                  {searchTerm ? "Try adjusting your search terms or filters" : "Create your first task to get started"}
                </p>
                <div className="font-body-12 text-gray-500 bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                  💡 <strong>Stay Compliant with Poligap</strong><br/>
                  Manage your compliance tasks efficiently and never miss important deadlines.
                </div>
              </div>
            </div>
          ) : (
              <div className="space-y-5">
                {filteredTasks.map((task) => {
                  const s = getSourceStyle(task.source);
                  const idKey = task._id || task.id;
                  const isExpanded = expandedTask === idKey;
                  const description = getSuggestedFix(task.description);
                  const shouldTruncate = description && description.length > 120;
                  const displayDescription = shouldTruncate && !isExpanded 
                    ? description.substring(0, 120) + '...'
                    : description;
                  
                  return (
                    <div key={idKey} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 p-6 hover:border-gray-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Badges Row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-body-12-medium rounded-full px-3 py-1 flex items-center gap-1.5 ${
                              task.source === 'compliance' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                              task.source === 'contract' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                              'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {s.icon}
                              <span className="capitalize">{task.source || 'manual'}</span>
                            </span>
                            
                            <span className={`font-body-12-medium rounded-full px-3 py-1 ${
                              task.priority === 'critical' ? 'bg-red-100 text-red-800 border border-red-200' :
                              task.priority === 'high' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              'bg-green-100 text-green-800 border border-green-200'
                            }`}>
                              {task.priority.toUpperCase()}
                            </span>
                            
                            <span className={`font-body-12-medium rounded-full px-3 py-1 ${
                              task.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              task.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {task.status.replace("-", " ").toUpperCase()}
                            </span>
                            
                            <span className="font-body-12-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-lg px-3 py-1">
                              {task.category || "General Improvement"}
                            </span>
                          </div>
                          
                          {/* Task Title */}
                          <h3 className="text-gray-900 font-body-16-medium leading-tight">
                            {task.title}
                          </h3>
                          
                          {/* Task Description */}
                          <div className="text-gray-700 font-body-14 leading-relaxed">
                            <p>{displayDescription}</p>
                            {shouldTruncate && (
                              <button
                                onClick={() => setExpandedTask(isExpanded ? null : idKey)}
                                className="text-teal-600 hover:text-teal-700 font-body-12-medium mt-1 underline"
                              >
                                {isExpanded ? 'Show Less' : 'Read More'}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 ml-6">
                          <div className="bg-gray-50 rounded-lg p-1 flex items-center gap-1">
                            <button
                              onClick={() => { setInfoTask(task); setInfoOpen(true); }}
                              className="text-gray-600 hover:text-teal-600 hover:bg-white rounded-md p-2 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Task info"
                            >
                              <Info className="h-5 w-5" />
                            </button>
                            
                            {task.status !== 'completed' ? (
                              <button
                                onClick={() => updateTask(task, { status: 'completed' })}
                                className="text-gray-600 hover:text-emerald-600 hover:bg-white rounded-md p-2 transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Mark as complete"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => updateTask(task, { status: 'pending' })}
                                className="text-gray-600 hover:text-amber-600 hover:bg-white rounded-md p-2 transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Mark as pending"
                              >
                                <RotateCcw className="h-5 w-5" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => deleteTask(task)}
                              className="text-gray-600 hover:text-red-600 hover:bg-white rounded-md p-2 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Delete task"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-h3">Task Information</DialogTitle>
            <DialogDescription className="font-body-14 text-gray-600">Details about the document and analysis.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 font-body-14">
            <div>
                <span className="font-body-14-medium">Document:</span>{' '}
              <span>{(infoTask?.sourceRef && (infoTask.sourceRef.fileName || infoTask.sourceRef.documentName)) || 'Unknown'}</span>
            </div>
            {infoTask?.sourceRef?.standard && (
              <div>
                <span className="font-body-14-medium">Standards:</span>{' '}
                <span>{infoTask.sourceRef.standard}</span>
              </div>
            )}
            <div>
                <span className="font-body-14-medium">Analysis time:</span>{' '}
              <span>
                {(() => {
                  const iso = (infoTask?.sourceRef?.analyzedAt as string) || infoTask?.createdAt;
                  if (!iso) return 'Unknown';
                  try { return new Date(iso).toLocaleString(); } catch { return iso; }
                })()}
              </span>
            </div>
            {infoTask?.source && (
              <div>
                <span className="font-body-14-medium">Source:</span>{' '}
                <span className="capitalize">{infoTask.source}</span>
              </div>
            )}
            {infoTask?.sourceRef?.resultId && (
              <div className="font-body-12 text-muted-foreground">Result ID: {infoTask.sourceRef.resultId}</div>
            )}
            {infoTask?.sourceRef?.gapId && (
              <div className="font-body-12 text-muted-foreground">Gap ID: {infoTask.sourceRef.gapId}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
