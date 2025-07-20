import { useState, useEffect } from 'react';
import { Case } from '@/lib/storage/types';
import { LocalStorage } from '@/lib/storage/localStorage';

export function useLocalCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LocalStorage.initialize();
    const loadedCases = LocalStorage.getCases();
    setCases(loadedCases);
    setLoading(false);
  }, []);

  const createCase = (caseData: Partial<Case>) => {
    const newCase = LocalStorage.createCase(caseData);
    setCases(LocalStorage.getCases()); // Refresh from storage
    return newCase;
  };

  const updateCase = (id: string, updates: Partial<Case>) => {
    const updatedCase = LocalStorage.updateCase(id, updates);
    if (updatedCase) {
      setCases(LocalStorage.getCases()); // Refresh from storage
    }
    return updatedCase;
  };

  const searchCases = (query: string): Case[] => {
    return LocalStorage.searchCases(query);
  };

  const getCaseByName = (name: string): Case | undefined => {
    return cases.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
  };

  const getCasesByStatus = (status: Case['status']) => {
    return cases.filter(c => c.status === status);
  };

  return {
    cases,
    loading,
    createCase,
    updateCase,
    searchCases,
    getCaseByName,
    getCasesByStatus
  };
}
