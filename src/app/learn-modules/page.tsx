"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Lesson = {
  id: string;
  title: string;
  durationMinutes?: number;
  summary?: string;
  content?: string;
  resources?: { title: string; url: string }[];
};

type Module = {
  id: string;
  title: string;
  summary?: string;
  durationMinutes?: number;
  level?: string;
  author?: string;
  tags?: string[];
  objectives?: string[];
  prerequisites?: string[];
  detailedDescription?: string;
  lessons?: Lesson[];
  resources?: { title: string; url: string }[];
};

export default function LearnModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, { completedLessons: string[] }>>({});
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/training/list');
        if (!res.ok) return setModules([]);
        const json = await res.json();
        if (mounted && Array.isArray(json.modules)) setModules(json.modules);
      } catch (e) {
        console.error('Failed to load learn modules:', e);
        setModules([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    // load progress from localStorage
    try {
      const raw = localStorage.getItem('learn-progress');
      if (raw) setProgress(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // persist progress
    try {
      localStorage.setItem('learn-progress', JSON.stringify(progress));
    } catch (e) {
      // ignore
    }
  }, [progress]);

  // helpers
  function isStarted(entry?: { completedLessons: string[] } | undefined) {
    return !!entry;
  }

  function calcProgressPercent(entry: { completedLessons: string[] } | undefined, m?: Module) {
    const total = (m && m.lessons && m.lessons.length) || 0;
    if (total === 0) return 0;
    const done = (entry && entry.completedLessons && entry.completedLessons.length) || 0;
    return Math.round((done / total) * 100);
  }

  function handleStartResume(moduleId: string) {
    // open/expand module and ensure progress entry exists
    setExpanded(prev => ({ ...prev, [moduleId]: true }));
    setProgress(prev => {
      if (prev[moduleId]) return prev;
      return { ...prev, [moduleId]: { completedLessons: [] } };
    });
    // if module has lessons, open first lesson in viewer to start
    const m = modules.find(x => x.id === moduleId);
    const firstLesson = m?.lessons && m.lessons.length > 0 ? m.lessons[0].id : null;
    if (firstLesson) {
      openLesson(moduleId, firstLesson);
    }
    // scroll the module card into view so the user sees the expanded content
    try {
      const el = document.getElementById(`module-${moduleId}`);
      if (el && typeof el.scrollIntoView === 'function') {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
      }
    } catch (e) {
      // ignore
    }
  }

  function isLessonComplete(entry: { completedLessons: string[] } | undefined, lessonId: string) {
    if (!entry || !entry.completedLessons) return false;
    return entry.completedLessons.includes(lessonId);
  }

  function toggleLessonComplete(moduleId: string, lessonId: string) {
    setProgress(prev => {
      const entry = prev[moduleId] || { completedLessons: [] };
      const exists = entry.completedLessons.includes(lessonId);
      const updated = exists
        ? entry.completedLessons.filter(id => id !== lessonId)
        : [...entry.completedLessons, lessonId];
      return { ...prev, [moduleId]: { completedLessons: updated } };
    });
  }

  // lesson viewer helpers
  function openLesson(moduleId: string, lessonId: string) {
    setExpanded(prev => ({ ...prev, [moduleId]: true }));
    setActiveModuleId(moduleId);
    setActiveLessonId(lessonId);
    setViewerOpen(true);
    // ensure module in view
    try {
      const el = document.getElementById(`module-${moduleId}`);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
    } catch (e) {}
  }

  function closeViewer() {
    setViewerOpen(false);
    setActiveLessonId(null);
  }

  function findActive() {
    const module = modules.find(m => m.id === activeModuleId) || null;
    const lesson = module?.lessons?.find(l => l.id === activeLessonId) || null;
    return { module, lesson } as { module: Module | null; lesson: Lesson | null };
  }

  function nextLesson() {
    const { module } = findActive();
    if (!module || !activeLessonId) return;
    const idx = module.lessons?.findIndex(l => l.id === activeLessonId) ?? -1;
    if (idx >= 0 && module.lessons && idx < module.lessons.length - 1) {
      const next = module.lessons[idx + 1];
      setActiveLessonId(next.id);
    }
  }

  function prevLesson() {
    const { module } = findActive();
    if (!module || !activeLessonId) return;
    const idx = module.lessons?.findIndex(l => l.id === activeLessonId) ?? -1;
    if (idx > 0 && module.lessons) {
      const prev = module.lessons[idx - 1];
      setActiveLessonId(prev.id);
    }
  }

  function markCompleteAndAdvance() {
    if (!activeModuleId || !activeLessonId) return;
    // mark complete
    setProgress(prev => {
      const entry = prev[activeModuleId] || { completedLessons: [] };
      if (!entry.completedLessons.includes(activeLessonId)) {
        const updated = [...entry.completedLessons, activeLessonId];
        return { ...prev, [activeModuleId]: { completedLessons: updated } };
      }
      return prev;
    });
    // try advance
    const { module } = findActive();
    const idx = module?.lessons?.findIndex(l => l.id === activeLessonId) ?? -1;
    if (module && idx >= 0 && idx < (module.lessons?.length ?? 0) - 1) {
      const next = module.lessons![idx + 1];
      setActiveLessonId(next.id);
    } else {
      // module finished
      closeViewer();
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Learn Modules</h1>
            <p className="text-sm text-muted-foreground mt-1">Interactive training and short courses to build compliance knowledge.</p>
          </div>
        </div>

        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>← Back to Home</Button>
        </div>
        {loading ? (
          <div className="space-y-3">
            <div className="h-6 w-48 bg-accent rounded animate-pulse" />
            <div className="h-4 w-64 bg-accent rounded animate-pulse" />
          </div>
        ) : modules.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm">No learning modules available yet. Check back later or contact your administrator.</p>
              <div className="mt-4 flex justify-center">
                <Button onClick={() => router.back()}>Back to Home</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {modules.map((m) => (
              <Card key={m.id} id={`module-${m.id}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-md bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{m.title}</h3>
                      <div className="text-xs text-muted-foreground">{m.level || 'All Levels'}</div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{m.summary}</p>
                    {m.detailedDescription && (
                      <p className="text-sm text-muted-foreground mt-2">{m.detailedDescription}</p>
                    )}

                    {/* Module meta */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground">{m.durationMinutes ? `${m.durationMinutes} min` : ''}</div>
                        {m.author && <div className="text-xs text-muted-foreground">By {m.author}</div>}
                        {m.tags && (
                          <div className="flex items-center gap-2">
                            {m.tags.slice(0,3).map(t => (
                              <span key={t} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* progress */}
                        <div className="w-40 bg-neutral/10 rounded overflow-hidden h-2">
                          <div
                            className="h-2 bg-indigo-600"
                            style={{ width: `${calcProgressPercent(progress[m.id], m)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">{calcProgressPercent(progress[m.id], m)}%</div>
                        <Button size="sm" onClick={() => handleStartResume(m.id)}>{isStarted(progress[m.id]) ? 'Resume' : 'Start Module'}</Button>
                        <Button size="sm" variant="outline" onClick={() => setExpanded(prev => ({ ...prev, [m.id]: !prev[m.id] }))}>
                          {expanded[m.id] ? 'Hide details' : 'View details'}
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">{m.lessons ? `${m.lessons.length} lessons · ${m.prerequisites ? m.prerequisites.join(', ') : ''}` : 'No lessons listed'}</div>

                    {/* expanded lesson list */}
                    {expanded[m.id] && (
                      <div className="mt-3 border-t pt-3">
                        {m.objectives && (
                          <div className="text-sm text-muted-foreground mb-3">
                            <strong>Objectives:</strong>
                            <ul className="list-disc pl-5 mt-1">
                              {m.objectives.map((o, i) => <li key={i}>{o}</li>)}
                            </ul>
                          </div>
                        )}

                        {m.lessons && m.lessons.length > 0 ? (
                          <div className="space-y-2">
                            {m.lessons.map(lesson => (
                              <div key={lesson.id} className="flex items-start justify-between gap-3">
                                <div>
                                  <button className="text-left" onClick={() => openLesson(m.id, lesson.id)}>
                                    <div className="font-medium">{lesson.title}</div>
                                    <div className="text-xs text-muted-foreground">{lesson.durationMinutes ? `${lesson.durationMinutes} min` : ''} · {lesson.summary}</div>
                                  </button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    className={`px-3 py-1 rounded text-sm ${isLessonComplete(progress[m.id], lesson.id) ? 'bg-green-600 text-white' : 'bg-transparent border'}`}
                                    onClick={() => toggleLessonComplete(m.id, lesson.id)}
                                  >
                                    {isLessonComplete(progress[m.id], lesson.id) ? 'Completed' : 'Mark Complete'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No lesson details available.</div>
                        )}
                        <div className="mt-4 flex justify-end">
                          <Button size="sm" onClick={() => setExpanded(prev => ({ ...prev, [m.id]: false }))}>Close</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Lesson viewer panel */}
        {viewerOpen && activeModuleId && activeLessonId && (
          (() => {
            const module = modules.find(m => m.id === activeModuleId) || null;
            const lesson = module?.lessons?.find(l => l.id === activeLessonId) || null;
            if (!module || !lesson) return null;
            return (
              <div className="fixed inset-0 flex items-center justify-center z-50 p-6 pointer-events-none">
                <div className="max-w-3xl w-full pointer-events-auto">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">{module.title} · {lesson.title}</div>
                          <h2 className="text-lg font-semibold mt-1">{lesson.title}</h2>
                          <div className="text-xs text-muted-foreground mt-1">{lesson.durationMinutes ? `${lesson.durationMinutes} min` : ''}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => prevLesson()}>Prev</Button>
                          <Button size="sm" onClick={() => markCompleteAndAdvance()}>Mark Complete & Next</Button>
                          <Button size="sm" variant="outline" onClick={() => closeViewer()}>Close</Button>
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-muted-foreground">
                        {lesson.content || lesson.summary || 'No lesson content available.'}
                      </div>
                      {lesson.resources && lesson.resources.length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm font-semibold mb-2">Resources</div>
                          <ul className="list-disc pl-5 text-sm">
                            {lesson.resources.map(r => (
                              <li key={r.url}><a className="text-indigo-600 underline" href={r.url} target="_blank" rel="noreferrer">{r.title}</a></li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
