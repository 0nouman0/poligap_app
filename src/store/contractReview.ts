import { create } from 'zustand';

export interface DocumentVersion {
  id: string;
  version: number;
  content: string;
  timestamp: Date;
  description: string;
  appliedSuggestionId?: string;
  appliedSuggestionTitle?: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  clauses: TemplateClause[];
  lastUpdated: string;
  isBaseline: boolean;
  sources: string[];
}

export interface TemplateClause {
  id: string;
  title: string;
  content: string;
  isRequired: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  guidelines: string[];
}

export interface DocumentGap {
  id: string;
  sectionTitle: string;
  gapType: 'missing' | 'weak' | 'incomplete' | 'non-compliant';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
  startIndex: number;
  endIndex: number;
  originalText?: string;
  suggestedText?: string;
  confidence: number;
  legalImplications?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  category: 'legal_compliance' | 'clarity' | 'completeness' | 'risk_mitigation' | 'formatting';
}

export interface ExtractedDocument {
  id: string;
  fileName: string;
  fullText: string;
  sections: DocumentSection[];
  gaps: DocumentGap[];
  overallScore: number;
  templateId: string;
  metadata: {
    pageCount: number;
    extractedAt: Date;
    fileSize: number;
  };
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
  hasGaps: boolean;
  gapIds: string[];
}

export interface StructuredDoc {
  title: string;
  sections: {
    key: string;
    title: string;
    paragraphs: string[];
  }[];
  meta?: {
    counterparties?: string[];
    effectiveDate?: string;
    documentType?: string;
  };
}

export interface AISuggestion {
  id: string;
  type: 'addition' | 'deletion' | 'modification' | 'replacement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'legal_compliance' | 'clarity' | 'completeness' | 'risk_mitigation' | 'formatting';
  confidence: number;
  originalText: string;
  suggestedText: string;
  startIndex: number;
  endIndex: number;
  reasoning: string;
  legalImplications: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  section: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'reviewing';
  acceptedAt?: Date;
  rejectedAt?: Date;
  userNote?: string;
  clauseType?: string;
}

export interface ContractReviewState {
  // Document state
  structuredDoc: StructuredDoc | null;
  extractedDocument: ExtractedDocument | null;
  originalText: string;
  currentText: string;
  
  // Template state
  selectedTemplate: ContractTemplate | null;
  availableTemplates: ContractTemplate[];
  
  // Analysis state
  suggestions: AISuggestion[];
  gaps: DocumentGap[];
  isAnalyzing: boolean;
  analysisProgress: number;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  currentStep: number;
  
  // Edit state
  patchStates: Record<string, 'pending' | 'accepted' | 'rejected'>;
  appliedFixes: string[];
  currentGapIndex: number;
  
  // Version history
  versions: DocumentVersion[];
  currentVersion: number;
  
  // Actions
  setStructuredDoc: (doc: StructuredDoc | null) => void;
  setExtractedDocument: (doc: ExtractedDocument | null) => void;
  setSelectedTemplate: (template: ContractTemplate | null) => void;
  setAvailableTemplates: (templates: ContractTemplate[]) => void;
  setSuggestions: (suggestions: AISuggestion[]) => void;
  setGaps: (gaps: DocumentGap[]) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisProgress: (progress: number) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentStep: (step: number) => void;
  updatePatchState: (id: string, state: 'pending' | 'accepted' | 'rejected') => void;
  acceptSuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;
  acceptAllSuggestions: () => void;
  undoLastFix: () => void;
  revertSuggestion: (id: string) => void;
  revertAllChanges: () => void;
  navigateGap: (direction: 'prev' | 'next') => void;
  createVersion: (description: string, suggestionId?: string, suggestionTitle?: string) => void;
  switchToVersion: (version: number) => void;
  updateCurrentText: (text: string) => void;
  exportRevisedDocument: () => string;
  resetState: () => void;
}

const defaultTemplates: ContractTemplate[] = [
  {
    id: 'service-agreement',
    name: 'Service Agreement',
    type: 'service',
    description: 'Standard service agreement template with essential clauses',
    clauses: [
      {
        id: 'parties',
        title: 'Parties',
        content: 'This Agreement is entered between [Company Name] and [Service Provider]',
        isRequired: true,
        priority: 'critical',
        guidelines: ['Must clearly identify all parties', 'Include legal entity names and addresses']
      },
      {
        id: 'scope',
        title: 'Scope of Services',
        content: 'Detailed description of services to be provided',
        isRequired: true,
        priority: 'critical',
        guidelines: ['Must be specific and measurable', 'Include deliverables and timelines']
      },
      {
        id: 'payment',
        title: 'Payment Terms',
        content: 'Payment schedule, amounts, and terms',
        isRequired: true,
        priority: 'high',
        guidelines: ['Clear payment schedule', 'Late payment penalties', 'Currency specification']
      },
      {
        id: 'termination',
        title: 'Termination Clause',
        content: 'Conditions under which agreement can be terminated',
        isRequired: true,
        priority: 'high',
        guidelines: ['Notice period requirements', 'Termination for cause', 'Post-termination obligations']
      },
      {
        id: 'liability',
        title: 'Limitation of Liability',
        content: 'Liability limitations and indemnification clauses',
        isRequired: true,
        priority: 'critical',
        guidelines: ['Cap on damages', 'Mutual indemnification', 'Insurance requirements']
      }
    ],
    lastUpdated: '2024-01-15',
    isBaseline: true,
    sources: ['Internal Legal KB', 'Law Insider']
  },
  {
    id: 'sla',
    name: 'Service Level Agreement (SLA)',
    type: 'technology',
    description: 'SLA template with uptime guarantees and service credits',
    clauses: [
      {
        id: 'uptime',
        title: 'Uptime Guarantee',
        content: 'The service will maintain 99.9% uptime per month',
        isRequired: true,
        priority: 'critical',
        guidelines: ['Minimum 99.9% uptime', 'Measurement methodology', 'Exclusions for maintenance']
      },
      {
        id: 'support',
        title: 'Support Response Time',
        content: 'Support tickets will be acknowledged within specified timeframes',
        isRequired: true,
        priority: 'high',
        guidelines: ['Response time tiers', '24/7 availability for critical issues', 'Escalation procedures']
      },
      {
        id: 'credits',
        title: 'Service Credits',
        content: 'Compensation for service level failures',
        isRequired: true,
        priority: 'medium',
        guidelines: ['Credit calculation method', 'Maximum credit limits', 'Claim procedures']
      }
    ],
    lastUpdated: '2024-03-20',
    isBaseline: true,
    sources: ['Internal Legal KB', 'Industry Standards']
  },
  {
    id: 'nda',
    name: 'Non-Disclosure Agreement (NDA)',
    type: 'legal',
    description: 'Mutual confidentiality agreement template',
    clauses: [
      {
        id: 'confidential-info',
        title: 'Confidential Information Definition',
        content: 'Definition of what constitutes confidential information',
        isRequired: true,
        priority: 'critical',
        guidelines: ['Broad but specific definition', 'Exclusions clearly stated', 'Marking requirements']
      },
      {
        id: 'obligations',
        title: 'Confidentiality Obligations',
        content: 'Duties and restrictions regarding confidential information',
        isRequired: true,
        priority: 'critical',
        guidelines: ['Non-disclosure requirements', 'Use limitations', 'Return/destruction obligations']
      },
      {
        id: 'term',
        title: 'Term and Survival',
        content: 'Duration of confidentiality obligations',
        isRequired: true,
        priority: 'high',
        guidelines: ['Agreement term', 'Survival period', 'Perpetual obligations for trade secrets']
      }
    ],
    lastUpdated: '2024-01-28',
    isBaseline: true,
    sources: ['Cornell LII', 'Law Insider']
  }
];

export const useContractReviewStore = create<ContractReviewState>((set, get) => ({
  // Initial state
  structuredDoc: null,
  extractedDocument: null,
  originalText: '',
  currentText: '',
  selectedTemplate: null,
  availableTemplates: defaultTemplates,
  suggestions: [],
  gaps: [],
  isAnalyzing: false,
  analysisProgress: 0,
  isLoading: false,
  error: null,
  currentStep: 1,
  patchStates: {},
  appliedFixes: [],
  currentGapIndex: 0,
  
  // Version history
  versions: [],
  currentVersion: 0,

  // Actions
  setStructuredDoc: (doc) => set({ structuredDoc: doc }),
  
  setExtractedDocument: (doc) => {
    set({ extractedDocument: doc });
    if (doc) {
      const initialVersion: DocumentVersion = {
        id: 'v0',
        version: 0,
        content: doc.fullText,
        timestamp: new Date(),
        description: 'Original document'
      };
      
      set({ 
        originalText: doc.fullText,
        currentText: doc.fullText,
        currentStep: 2,
        versions: [initialVersion],
        currentVersion: 0
      });
    }
  },
  
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  
  setAvailableTemplates: (templates) => set({ availableTemplates: templates }),
  
  setSuggestions: (suggestions) => {
    set({ suggestions });
    // Initialize patch states for new suggestions
    const newPatchStates: Record<string, 'pending' | 'accepted' | 'rejected'> = {};
    suggestions.forEach(suggestion => {
      if (!get().patchStates[suggestion.id]) {
        newPatchStates[suggestion.id] = 'pending';
      }
    });
    set(state => ({ 
      patchStates: { ...state.patchStates, ...newPatchStates }
    }));
  },
  
  setGaps: (gaps) => set({ gaps }),
  
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  
  setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  updatePatchState: (id, state) => 
    set(prev => ({ 
      patchStates: { ...prev.patchStates, [id]: state }
    })),
  
  acceptSuggestion: (id) => {
    const state = get();
    const suggestion = state.suggestions.find(s => s.id === id);
    if (!suggestion) return;

    // Update suggestion status
    const updatedSuggestions = state.suggestions.map(s => 
      s.id === id 
        ? { ...s, status: 'accepted' as const, acceptedAt: new Date() }
        : s
    );

    // Apply the change to current text
    let newText = state.currentText;
    if (suggestion.type === 'deletion') {
      newText = newText.slice(0, suggestion.startIndex) + newText.slice(suggestion.endIndex);
    } else if (suggestion.type === 'addition') {
      newText = newText.slice(0, suggestion.startIndex) + suggestion.suggestedText + newText.slice(suggestion.startIndex);
    } else {
      newText = newText.slice(0, suggestion.startIndex) + suggestion.suggestedText + newText.slice(suggestion.endIndex);
    }

    set({
      suggestions: updatedSuggestions,
      currentText: newText,
      patchStates: { ...state.patchStates, [id]: 'accepted' },
      appliedFixes: [...state.appliedFixes, id]
    });

    // Create a new version after applying the suggestion
    const suggestionTitle = `${suggestion.category} - ${suggestion.clauseType}`;
    get().createVersion(
      `Applied ${suggestion.type}: ${suggestionTitle}`,
      suggestion.id,
      suggestionTitle
    );
  },
  
  rejectSuggestion: (id) => {
    const state = get();
    const updatedSuggestions = state.suggestions.map(s => 
      s.id === id 
        ? { ...s, status: 'rejected' as const, rejectedAt: new Date() }
        : s
    );

    set({
      suggestions: updatedSuggestions,
      patchStates: { ...state.patchStates, [id]: 'rejected' }
    });
  },
  
  acceptAllSuggestions: () => {
    const state = get();
    const pendingSuggestions = state.suggestions.filter(s => s.status === 'pending');
    
    pendingSuggestions.forEach(suggestion => {
      get().acceptSuggestion(suggestion.id);
    });
  },
  
  undoLastFix: () => {
    const state = get();
    if (state.appliedFixes.length === 0) return;
    
    const lastFixId = state.appliedFixes[state.appliedFixes.length - 1];
    const suggestion = state.suggestions.find(s => s.id === lastFixId);
    
    if (suggestion) {
      // Revert the text change
      let revertedText = state.currentText;
      if (suggestion.type === 'addition') {
        // Remove the added text
        const addedTextStart = suggestion.startIndex;
        const addedTextEnd = addedTextStart + suggestion.suggestedText.length;
        revertedText = revertedText.slice(0, addedTextStart) + revertedText.slice(addedTextEnd);
      } else if (suggestion.type === 'deletion') {
        // Re-add the deleted text
        revertedText = revertedText.slice(0, suggestion.startIndex) + suggestion.originalText + revertedText.slice(suggestion.startIndex);
      } else {
        // Revert modification
        revertedText = revertedText.slice(0, suggestion.startIndex) + suggestion.originalText + revertedText.slice(suggestion.startIndex + suggestion.suggestedText.length);
      }
      
      const updatedSuggestions = state.suggestions.map(s => 
        s.id === lastFixId 
          ? { ...s, status: 'pending' as const, acceptedAt: undefined }
          : s
      );
      
      set({
        suggestions: updatedSuggestions,
        currentText: revertedText,
        patchStates: { ...state.patchStates, [lastFixId]: 'pending' },
        appliedFixes: state.appliedFixes.slice(0, -1)
      });
    }
  },
  
  navigateGap: (direction) => {
    const state = get();
    const totalGaps = state.suggestions.length;
    if (totalGaps === 0) return;
    
    let newIndex = state.currentGapIndex;
    if (direction === 'next') {
      newIndex = (newIndex + 1) % totalGaps;
    } else {
      newIndex = newIndex === 0 ? totalGaps - 1 : newIndex - 1;
    }
    
    set({ currentGapIndex: newIndex });
  },
  
  updateCurrentText: (text) => set({ currentText: text }),
  
  exportRevisedDocument: () => {
    const state = get();
    let revisedText = state.currentText;
    
    // Apply all accepted suggestions to the text
    const acceptedSuggestions = state.suggestions
      .filter(s => state.patchStates[s.id] === 'accepted')
      .sort((a, b) => b.startIndex - a.startIndex); // Sort by position (reverse order)
    
    acceptedSuggestions.forEach(suggestion => {
      if (suggestion.type === 'addition') {
        revisedText = revisedText.slice(0, suggestion.startIndex) + 
                     suggestion.suggestedText + 
                     revisedText.slice(suggestion.startIndex);
      } else if (suggestion.type === 'deletion') {
        revisedText = revisedText.slice(0, suggestion.startIndex) + 
                     revisedText.slice(suggestion.endIndex);
      } else if (suggestion.type === 'modification' || suggestion.type === 'replacement') {
        revisedText = revisedText.slice(0, suggestion.startIndex) + 
                     suggestion.suggestedText + 
                     revisedText.slice(suggestion.endIndex);
      }
    });
    
    return revisedText;
  },
  
  revertSuggestion: (id) => {
    const state = get();
    const suggestion = state.suggestions.find(s => s.id === id);
    
    if (!suggestion || state.patchStates[id] !== 'accepted') return;
    
    // Revert the text change
    let revertedText = state.currentText;
    if (suggestion.type === 'addition') {
      // Remove the added text
      const addedTextStart = suggestion.startIndex;
      const addedTextEnd = addedTextStart + suggestion.suggestedText.length;
      revertedText = revertedText.slice(0, addedTextStart) + revertedText.slice(addedTextEnd);
    } else if (suggestion.type === 'deletion' && suggestion.originalText) {
      // Re-add the deleted text
      revertedText = revertedText.slice(0, suggestion.startIndex) + suggestion.originalText + revertedText.slice(suggestion.startIndex);
    } else if ((suggestion.type === 'modification' || suggestion.type === 'replacement') && suggestion.originalText) {
      // Revert modification
      revertedText = revertedText.slice(0, suggestion.startIndex) + suggestion.originalText + revertedText.slice(suggestion.startIndex + suggestion.suggestedText.length);
    }
    
    set({
      currentText: revertedText,
      patchStates: {
        ...state.patchStates,
        [id]: 'pending'
      },
      appliedFixes: state.appliedFixes.filter(fixId => fixId !== id)
    });
  },
  
  revertAllChanges: () => {
    const state = get();
    const acceptedSuggestionIds = Object.keys(state.patchStates).filter(id => state.patchStates[id] === 'accepted');
    
    // Reset to original text
    set({
      currentText: state.originalText,
      patchStates: Object.keys(state.patchStates).reduce((acc, id) => {
        acc[id] = acceptedSuggestionIds.includes(id) ? 'pending' : state.patchStates[id];
        return acc;
      }, {} as Record<string, 'pending' | 'accepted' | 'rejected'>),
      appliedFixes: []
    });
  },
  
  createVersion: (description, suggestionId, suggestionTitle) => {
    const state = get();
    const newVersion: DocumentVersion = {
      id: `v${state.versions.length}`,
      version: state.versions.length,
      content: state.currentText,
      timestamp: new Date(),
      description,
      appliedSuggestionId: suggestionId,
      appliedSuggestionTitle: suggestionTitle
    };
    
    set({
      versions: [...state.versions, newVersion],
      currentVersion: newVersion.version
    });
  },
  
  switchToVersion: (version) => {
    const state = get();
    const targetVersion = state.versions.find(v => v.version === version);
    if (targetVersion) {
      set({
        currentText: targetVersion.content,
        currentVersion: version
      });
    }
  },
  
  resetState: () => set({
    structuredDoc: null,
    extractedDocument: null,
    originalText: '',
    currentText: '',
    selectedTemplate: null,
    suggestions: [],
    gaps: [],
    isAnalyzing: false,
    analysisProgress: 0,
    isLoading: false,
    error: null,
    currentStep: 1,
    patchStates: {},
    appliedFixes: [],
    currentGapIndex: 0,
    versions: [],
    currentVersion: 0
  })
}));
