/**
 * TabContext
 *
 * Sayfa tablarını Header (AppBar) içinde göstermek için kullanılan context.
 * Her sayfa kendi tab verilerini bu context üzerinden Header'a iletir.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface HeaderTab {
  key: string;
  icon?: React.ReactNode;
  label: string;
  badge?: string;
}

interface TabContextValue {
  tabs: HeaderTab[];
  activeTabIndex: number;
  backLabel: string;
  setTabs: (tabs: HeaderTab[]) => void;
  setActiveTabIndex: (index: number) => void;
  setBackLabel: (label: string) => void;
  onTabChange: ((index: number) => void) | null;
  setOnTabChange: (handler: ((index: number) => void) | null) => void;
  onTabClose: ((e: React.MouseEvent, index: number) => void) | null;
  setOnTabClose: (handler: ((e: React.MouseEvent, index: number) => void) | null) => void;
  onBackToList: (() => void) | null;
  setOnBackToList: (handler: (() => void) | null) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<HeaderTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(-1);
  const [backLabel, setBackLabel] = useState('Listeye Dön');
  const [onTabChange, setOnTabChange] = useState<((index: number) => void) | null>(null);
  const [onTabClose, setOnTabClose] = useState<((e: React.MouseEvent, index: number) => void) | null>(null);
  const [onBackToList, setOnBackToList] = useState<(() => void) | null>(null);

  const value = useMemo(() => ({
    tabs,
    activeTabIndex,
    backLabel,
    setTabs,
    setActiveTabIndex,
    setBackLabel,
    onTabChange,
    setOnTabChange: (handler: ((index: number) => void) | null) => setOnTabChange(() => handler),
    onTabClose,
    setOnTabClose: (handler: ((e: React.MouseEvent, index: number) => void) | null) => setOnTabClose(() => handler),
    onBackToList,
    setOnBackToList: (handler: (() => void) | null) => setOnBackToList(() => handler),
  }), [tabs, activeTabIndex, backLabel, onTabChange, onTabClose, onBackToList]);

  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  );
};

export const useHeaderTabs = () => {
  const context = useContext(TabContext);
  if (!context) throw new Error('useHeaderTabs must be used within TabProvider');
  return context;
};

export default TabContext;
