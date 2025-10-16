"use client";

import React, { useEffect, useState } from "react";
import { CheckSquare, Plus, Filter, Check, RotateCcw, Trash2, Shield, FileText, Info, ChevronDown, MoreHorizontal, X } from "lucide-react";
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
    <div className="min-h-screen bg-background dark:bg-background select-none">
      <div className="w-full px-6 mx-auto" style={{ maxWidth: '1640px' }}>
        {/* Header Section */}
        <div className="py-6 flex items-center justify-between">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-card dark:bg-card shadow-sm flex items-center justify-center border border-border dark:border-border">
                <CheckSquare className="h-6 w-6 text-primary dark:text-primary" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground dark:text-foreground">My Tasks</h1>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Manage your compliance and contract review tasks</p>
              </div>
            </div>
          </div>
          
          {/* New Task Button */}
          <button
            onClick={() => setShowNewTaskForm(true)}
            className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-[5px] px-4 h-9 shadow-sm transition-all duration-200"
          >
            + New Task
          </button>
        </div>
        
        {/* Filter Bar */}
        <div className="bg-card dark:bg-card rounded-[10px] shadow-sm mb-[30px] border border-border dark:border-border">
          <div className="flex items-center justify-between px-4 h-[42px]">
            {/* Tabs */}
            <div className="flex items-center gap-12 relative">
              <button
                onClick={() => setActiveTab('all')}
                className={`text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'all' ? 'text-foreground dark:text-foreground' : 'text-muted-foreground dark:text-muted-foreground'
                }`}
              >
                All Tasks
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'pending' ? 'text-foreground dark:text-foreground' : 'text-muted-foreground dark:text-muted-foreground'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'completed' ? 'text-foreground dark:text-foreground' : 'text-muted-foreground dark:text-muted-foreground'
                }`}
              >
                Completed
              </button>
              {/* Active Indicator Line */}
              <div 
                className="absolute bottom-[-10px] h-[2px] bg-primary dark:bg-primary transition-all duration-300"
                style={{
                  width: '82px',
                  left: activeTab === 'all' ? '0px' : activeTab === 'pending' ? '120px' : '240px'
                }}
              />
            </div>
            
            {/* Right Side Filters */}
            <div className="flex items-center gap-4 filter-container relative">
              {/* Search Box */}
              <div className="relative">
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-[185px] pl-8 pr-3 text-xs bg-card dark:bg-card border-border dark:border-border rounded-[5px] text-foreground dark:text-foreground select-text placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
                />
                <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground dark:text-muted-foreground" />
              </div>
            
              {/* All Sources Dropdown */}
              <button className="h-8 px-2.5 flex items-center gap-2 text-xs font-medium text-muted-foreground dark:text-muted-foreground bg-card dark:bg-card border border-border dark:border-border rounded-[5px] hover:bg-accent dark:hover:bg-accent">
                All Sources
                <ChevronDown className="h-3 w-3" />
              </button>
              
              {/* All Priorities Dropdown */}
              <button className="h-8 px-2.5 flex items-center gap-2 text-xs font-medium text-muted-foreground dark:text-muted-foreground bg-card dark:bg-card border border-border dark:border-border rounded-[5px] hover:bg-accent dark:hover:bg-accent">
                All Priorities
                <ChevronDown className="h-3 w-3" />
              </button>
              
              {/* Apply Button */}
              <button className="h-8 px-4 text-xs font-semibold text-primary-foreground bg-primary rounded-[5px] hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 transition-colors">
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* New Task Form Inline */}
        {showNewTaskForm && (
          <div className="bg-card dark:bg-card rounded-[10px] shadow-sm mb-[30px] animate-in fade-in-0 slide-in-from-top-2 duration-200 border border-border dark:border-border">
            <div className="p-6 pb-8">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground dark:text-foreground mb-1">Create New Task</h2>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">Add a new compliance or contract review task</p>
                </div>
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowNewTaskForm(false);
                    setNewTaskTitle("");
                    setNewTaskDescription("");
                    setNewTaskSource('manual');
                  }}
                  className="text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Form Fields */}
              <div className="flex items-end gap-6">
                {/* Task Title */}
                <div className="flex flex-col gap-[18px] flex-1 max-w-[344px]">
                  <label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Task Title</label>
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="New ITSM Project"
                    className="h-10 px-3 text-sm text-foreground dark:text-foreground bg-card dark:bg-card border border-border dark:border-border rounded-[5px] select-text placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
                  />
                </div>
                
                {/* Task Type */}
                <div className="flex flex-col gap-[18px] flex-1 max-w-[344px]">
                  <label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Task Type</label>
                  <Select value={newTaskSource} onValueChange={(v: any) => setNewTaskSource(v)}>
                    <SelectTrigger className="h-10 px-3 text-sm text-foreground dark:text-foreground bg-card dark:bg-card border border-border dark:border-border rounded-[5px] w-full">
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliance">Compliance Gap</SelectItem>
                      <SelectItem value="contract">Contract Review</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Description */}
                <div className="flex flex-col gap-[18px] flex-1">
                  <label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Description</label>
                  <Input
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Description"
                    className="h-10 px-3 text-sm text-foreground dark:text-foreground bg-card dark:bg-card border border-border dark:border-border rounded-[5px] select-text placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
                  />
                </div>
                
                {/* Create Task Button */}
                <button
                  onClick={createTask}
                  disabled={!newTaskTitle.trim()}
                  className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-xs font-semibold rounded-[5px] px-4 h-[35px] transition-colors whitespace-nowrap"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="pb-6">

          <div className="space-y-[30px]">
          {loading && (
            <div className="bg-card dark:bg-card rounded-[10px] shadow-sm p-8 text-center text-muted-foreground dark:text-muted-foreground text-sm border border-border dark:border-border">
              Loading tasks…
            </div>
          )}
          {!!error && (
            <div className="bg-card dark:bg-card rounded-[10px] shadow-sm p-8 text-center text-red-600 dark:text-red-400 text-sm border border-border dark:border-border">
              {error}
            </div>
          )}
          {!loading && !error && filteredTasks.length === 0 ? (
            <div className="bg-card dark:bg-card rounded-[10px] shadow-sm p-12 border border-border dark:border-border">
              <div className="text-center">
                <div className="bg-primary/10 dark:bg-primary/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <CheckSquare className="h-10 w-10 text-primary dark:text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">No tasks found</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search terms or filters" : "Create your first task to get started"}
                </p>
                <div className="text-xs text-muted-foreground dark:text-muted-foreground bg-accent dark:bg-accent rounded-lg p-4 max-w-md mx-auto">
                  💡 <strong className="text-foreground dark:text-foreground">Stay Compliant with Poligap</strong><br/>
                  Manage your compliance tasks efficiently and never miss important deadlines.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-[30px]">
                {filteredTasks.map((task) => {
                  const idKey = task._id || task.id;
                  const isExpanded = expandedTask === idKey;
                  const description = getSuggestedFix(task.description);
                  const shouldTruncate = description && description.length > 120;
                  const displayDescription = shouldTruncate && !isExpanded 
                    ? description.substring(0, 120) + '...'
                    : description;
                  
                  return (
                    <div key={idKey} className="bg-card dark:bg-card rounded-[10px] shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between px-5 py-[15px] border border-border dark:border-border">
                      {/* Left Side: Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="space-y-[7px]">
                          {/* Badges Row */}
                          <div className="flex items-center gap-[11px]">
                            {/* Source Badge */}
                            {task.source === 'compliance' && (
                              <span className="bg-[#E8E9FF] dark:bg-primary/20 text-[#6E72FF] dark:text-primary text-xs font-medium rounded-[35px] px-2.5 py-1 flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5" />
                                Compliance
                              </span>
                            )}
                            {task.source === 'contract' && (
                              <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-[35px] px-2.5 py-1 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                Contract
                              </span>
                            )}
                            {task.source === 'manual' && (
                              <span className="bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 text-xs font-medium rounded-[35px] px-2.5 py-1 flex items-center gap-1.5">
                                <CheckSquare className="h-3.5 w-3.5" />
                                Manual
                              </span>
                            )}
                            
                            {/* Status Badge */}
                            <span className={`text-xs font-medium rounded-[35px] px-2.5 py-1 ${
                              task.status === 'pending' ? 'bg-[#FFF8CB] dark:bg-yellow-500/20 text-[#BF6D0A] dark:text-yellow-400' :
                              task.status === 'completed' ? 'bg-[#EDFFDE] dark:bg-green-500/20 text-[#47AF47] dark:text-green-400' :
                              'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400'
                            }`}>
                              {task.status === 'pending' ? 'Pending' : task.status === 'completed' ? 'Completed' : task.status}
                            </span>
                            
                            {/* Priority Badge */}
                            <span className={`text-xs font-medium rounded-[35px] px-2.5 py-1 ${
                              task.priority === 'critical' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' :
                              task.priority === 'high' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400' :
                              task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                              'bg-[#EDFFDE] dark:bg-green-500/20 text-[#47AF47] dark:text-green-400'
                            }`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                          </div>
                          
                          {/* Task Title */}
                          <h3 className="text-foreground dark:text-foreground text-base font-semibold leading-tight select-text">
                            {task.title}
                          </h3>
                          
                          {/* Task Description */}
                          <div className="text-muted-foreground dark:text-muted-foreground text-xs leading-relaxed select-text" style={{ lineHeight: '1.5em' }}>
                            <p>{displayDescription}</p>
                            {shouldTruncate && (
                              <button
                                onClick={() => setExpandedTask(isExpanded ? null : idKey)}
                                className="text-primary dark:text-primary hover:text-primary/90 dark:hover:text-primary/90 text-xs font-medium mt-1 underline"
                              >
                                {isExpanded ? 'Show Less' : 'Read More'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Side: Actions */}
                      <div className="flex items-center gap-[11px]">
                        {/* Category Badge */}
                        <span className="bg-accent dark:bg-accent text-foreground dark:text-foreground text-xs font-medium rounded-[35px] px-2.5 py-1 whitespace-nowrap">
                          General Improvement
                        </span>
                        
                        {/* Action Buttons */}
                        <button
                          onClick={() => { setInfoTask(task); setInfoOpen(true); }}
                          className="text-foreground dark:text-foreground hover:text-primary dark:hover:text-primary transition-colors p-1"
                          title="Task info"
                        >
                          <Info className="h-6 w-6" />
                        </button>
                        
                        {task.status !== 'completed' ? (
                          <button
                            onClick={() => updateTask(task, { status: 'completed' })}
                            className="text-foreground dark:text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1"
                            title="Mark as complete"
                          >
                            <Check className="h-6 w-6" />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateTask(task, { status: 'pending' })}
                            className="text-foreground dark:text-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors p-1"
                            title="Mark as pending"
                          >
                            <RotateCcw className="h-6 w-6" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteTask(task)}
                          className="text-[#FF3465] dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors p-1"
                          title="Delete task"
                        >
                          <Trash2 className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="border-border dark:border-border rounded-[10px] bg-card dark:bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground dark:text-foreground">Task Information</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground dark:text-muted-foreground">Details about the document and analysis.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm select-text">
            <div>
                <span className="font-medium text-foreground dark:text-foreground">Document:</span>{' '}
              <span className="text-foreground dark:text-foreground">{(infoTask?.sourceRef && (infoTask.sourceRef.fileName || infoTask.sourceRef.documentName)) || 'Unknown'}</span>
            </div>
            {infoTask?.sourceRef?.standard && (
              <div>
                <span className="font-medium text-foreground dark:text-foreground">Standards:</span>{' '}
                <span className="text-foreground dark:text-foreground">{infoTask.sourceRef.standard}</span>
              </div>
            )}
            <div>
                <span className="font-medium text-foreground dark:text-foreground">Analysis time:</span>{' '}
              <span className="text-foreground dark:text-foreground">
                {(() => {
                  const iso = (infoTask?.sourceRef?.analyzedAt as string) || infoTask?.createdAt;
                  if (!iso) return 'Unknown';
                  try { return new Date(iso).toLocaleString(); } catch { return iso; }
                })()}
              </span>
            </div>
            {infoTask?.source && (
              <div>
                <span className="font-medium text-foreground dark:text-foreground">Source:</span>{' '}
                <span className="capitalize text-foreground dark:text-foreground">{infoTask.source}</span>
              </div>
            )}
            {infoTask?.sourceRef?.resultId && (
              <div className="text-xs text-muted-foreground dark:text-muted-foreground">Result ID: {infoTask.sourceRef.resultId}</div>
            )}
            {infoTask?.sourceRef?.gapId && (
              <div className="text-xs text-muted-foreground dark:text-muted-foreground">Gap ID: {infoTask.sourceRef.gapId}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
