"use client";

import React, { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
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
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { useTasksList, useCreateTask, useUpdateTask, useDeleteTask } from "@/lib/queries/useTasks";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyTasksPage() {
  const userData = useUserStore((state) => state.userData);
  const { 
    tasks: storeTasks,
    addTask: addTaskToStore,
    updateTask: updateTaskInStore, 
    deleteTask: deleteTaskFromStore,
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
  const [infoTask, setInfoTask] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  // Delete confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteTask, setPendingDeleteTask] = useState<Task | null>(null);

  // Tabs underline indicator positioning
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const allTabRef = useRef<HTMLButtonElement>(null);
  const pendingTabRef = useRef<HTMLButtonElement>(null);
  const completedTabRef = useRef<HTMLButtonElement>(null);
  const [indicatorLeft, setIndicatorLeft] = useState(0);
  const [indicatorWidth, setIndicatorWidth] = useState(0);

  const updateIndicator = () => {
    const container = tabsContainerRef.current;
    const btn = activeTab === 'all' ? allTabRef.current : activeTab === 'pending' ? pendingTabRef.current : completedTabRef.current;
    if (!container || !btn) return;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    const left = bRect.left - cRect.left;
    let width = btn.offsetWidth;
    // Clamp to avoid overflow
    const maxWidth = Math.max(0, cRect.width - left);
    width = Math.min(width, maxWidth);
    setIndicatorLeft(Math.max(0, left));
    setIndicatorWidth(width);
  };

  useEffect(() => {
    updateIndicator();
    // Recalculate on resize for responsiveness
    const onResize = () => updateIndicator();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const resolvedUserId = getUserId();
  const { data: queryTasks = [], isLoading: loading } = useTasksList(resolvedUserId);
  const createTaskMutation = useCreateTask(resolvedUserId);
  const updateTaskMutation = useUpdateTask(resolvedUserId);
  const deleteTaskMutation = useDeleteTask(resolvedUserId);

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

  const deferredSearch = useDeferredValue(searchTerm);
  const tasks: Task[] = queryTasks.length
    ? (queryTasks as any[]).map((t) => ({
        ...t,
        _id: ((t as any)._id || (t as any).id || "") as string,
      }))
    : storeTasks;
  const filteredTasks = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    return tasks.filter(task => {
      const matchesSearch = !term ||
        task.title.toLowerCase().includes(term) ||
        (task.description || "").toLowerCase().includes(term);
      const matchesStatus = activeTab === 'all' || task.status === activeTab;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesSource = sourceFilter === 'all' || task.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesSource;
    });
  }, [tasks, deferredSearch, activeTab, priorityFilter, sourceFilter]);

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
      
      const payload = {
        title,
        description: newTaskDescription.trim(),
        status: 'pending' as const,
        priority: 'medium' as const,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        category: 'General',
        source: newTaskSource,
        userId,
      };
      const created = await createTaskMutation.mutateAsync(payload);
      if (created) toastSuccess('Task Created', 'New task added successfully!');
      
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
      await updateTaskMutation.mutateAsync({ id, updates });
      toastSuccess('Task Updated', 'Task updated successfully!');
    } catch (e) {
      console.error('Update task failed', e);
      toastError('Update Failed', e instanceof Error ? e.message : 'Failed to update task');
      // Revert on error by refetching
      // Query invalidation will refresh; no manual reload needed
    }
  };

  const requestDeleteTask = (task: Task) => {
    setPendingDeleteTask(task);
    setConfirmOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!pendingDeleteTask) return;
    const id = pendingDeleteTask._id || pendingDeleteTask.id;
    if (!id) return;
    deleteTaskFromStore(id);
    try {
      await deleteTaskMutation.mutateAsync(id);
      toastSuccess('Task Deleted', 'Task removed successfully!');
    } catch (e) {
      console.error('Delete task failed', e);
      toastError('Delete Failed', e instanceof Error ? e.message : 'Failed to delete task');
    } finally {
      setConfirmOpen(false);
      setPendingDeleteTask(null);
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
            className="text-white text-xs font-semibold rounded-[5px] px-4 h-9 shadow-sm transition-all duration-200 hover:bg-[#2F36B0]"
            style={{ backgroundColor: '#3B43D6' }}
          >
            + New Task
          </button>
        </div>
        
        {/* Filter Bar */}
        <div className="bg-card dark:bg-card rounded-[10px] shadow-sm mb-[30px] border border-border dark:border-border">
          <div className="flex items-center justify-between px-4 h-[42px]">
            {/* Tabs */}
            <div ref={tabsContainerRef} className="flex items-center gap-12 relative">
              <button
                ref={allTabRef}
                onClick={() => setActiveTab('all')}
                className={`text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'all' ? 'text-foreground dark:text-foreground' : 'text-muted-foreground dark:text-muted-foreground'
                }`}
              >
                All Tasks
              </button>
              <button
                ref={pendingTabRef}
                onClick={() => setActiveTab('pending')}
                className={`text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'pending' ? 'text-foreground dark:text-foreground' : 'text-muted-foreground dark:text-muted-foreground'
                }`}
              >
                Pending
              </button>
              <button
                ref={completedTabRef}
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
                  width: `${indicatorWidth}px`,
                  left: `${indicatorLeft}px`
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
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-8 px-2.5 text-xs font-medium text-muted-foreground dark:text-muted-foreground bg-card dark:bg-card border border-border dark:border-border rounded-[5px] hover:bg-accent dark:hover:bg-accent w-[140px]">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              
              {/* All Priorities Dropdown */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-8 px-2.5 text-xs font-medium text-muted-foreground dark:text-muted-foreground bg-card dark:bg-card border border-border dark:border-border rounded-[5px] hover:bg-accent dark:hover:bg-accent w-[140px]">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Apply Button - Reset Filters */}
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setPriorityFilter('all');
                  setSourceFilter('all');
                  toastSuccess('Filters Reset', 'All filters have been cleared');
                }}
                className="h-8 px-4 text-xs font-semibold text-white rounded-[5px] transition-colors hover:bg-[#2F36B0]" 
                style={{ backgroundColor: '#3B43D6' }}
              >
                Reset
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
                  className="disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-[5px] px-4 h-[35px] transition-colors whitespace-nowrap hover:bg-[#2F36B0]"
                  style={{ backgroundColor: '#3B43D6' }}
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
            <div className="space-y-[30px]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card dark:bg-card rounded-[10px] shadow-sm p-5 border border-border dark:border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && filteredTasks.length === 0 ? (
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
                  const idKey = (task._id || task.id || '') as string;
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
                                onClick={() => setExpandedTask(isExpanded ? null : (idKey ?? null))}
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
                          onClick={() => requestDeleteTask(task)}
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

      {/* Delete Task Confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete task?"
        description={`This will permanently remove "${pendingDeleteTask?.title || 'this task'}".`}
        confirmText="Delete Task"
        onCancel={() => { setConfirmOpen(false); setPendingDeleteTask(null); }}
        onConfirm={confirmDeleteTask}
        requireAcknowledge
        acknowledgeLabel="I understand this action cannot be undone"
      />
    </div>
  );
}
