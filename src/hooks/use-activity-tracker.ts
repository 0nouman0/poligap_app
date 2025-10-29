import { useCallback } from 'react';
import { useActivityStore, ActivityHelpers, ActivityItem } from '@/stores/activity-store';
import { useUserStore } from '@/stores/user-store';

export const useActivityTracker = () => {
  const { addActivity } = useActivityStore();
  const { userData } = useUserStore();

  const trackActivity = useCallback((
    type: ActivityItem['type'],
    action: string,
    details: ActivityItem['details'] = {}
  ) => {
    addActivity({
      type,
      action,
      details,
      userId: userData?.userId || undefined,
    });
  }, [addActivity, userData?.userId]);

  // Convenience methods for common activities
  const trackComplianceCheck = useCallback((
    fileName: string,
    standards: string[],
    score?: number,
    status?: string
  ) => {
    const action = ActivityHelpers.complianceCheck(fileName, standards, score, status);
    trackActivity('compliance-check', action, {
      fileName,
      standards,
      score,
      status,
    });
  }, [trackActivity]);

  const trackContractReview = useCallback((
    fileName: string,
    template?: string,
    score?: number,
    status?: string
  ) => {
    const action = ActivityHelpers.contractReview(fileName, template, score);
    trackActivity('contract-review', action, {
      fileName,
      score,
      status,
    });
  }, [trackActivity]);

  const trackPolicyGeneration = useCallback((
    policyType: string,
    industry?: string,
    frameworks?: string[]
  ) => {
    const action = ActivityHelpers.policyGenerator(policyType, industry, frameworks);
    trackActivity('policy-generator', action, {
      policyType,
      industry,
    });
  }, [trackActivity]);

  const trackRulesAction = useCallback((
    action: 'created' | 'updated' | 'deleted',
    ruleName: string
  ) => {
    const actionText = ActivityHelpers.rulesManagement(action, ruleName);
    trackActivity('rules', actionText, {
      ruleName,
    });
  }, [trackActivity]);

  const trackSearch = useCallback((
    query: string,
    resultsCount?: number
  ) => {
    const action = ActivityHelpers.search(query, resultsCount);
    trackActivity('search', action, {
      searchQuery: query,
    });
  }, [trackActivity]);

  const trackChat = useCallback((
    message: string
  ) => {
    const action = ActivityHelpers.chat(message);
    trackActivity('chat', action, {
      chatMessage: message,
    });
  }, [trackActivity]);

  const trackKnowledgeBase = useCallback((
    action: 'viewed' | 'uploaded' | 'synced',
    fileName?: string,
    integration?: string
  ) => {
    const actionText = ActivityHelpers.knowledgeBase(action, fileName, integration);
    trackActivity('knowledge-base', actionText, {
      fileName,
    });
  }, [trackActivity]);

  const trackHistoryView = useCallback((
    fileName: string,
    type: 'compliance' | 'contract' | 'policy'
  ) => {
    const action = ActivityHelpers.historyView(fileName, type);
    trackActivity('history', action, {
      fileName,
    });
  }, [trackActivity]);

  return {
    trackActivity,
    trackComplianceCheck,
    trackContractReview,
    trackPolicyGeneration,
    trackRulesAction,
    trackSearch,
    trackChat,
    trackKnowledgeBase,
    trackHistoryView,
  };
};

export default useActivityTracker;
