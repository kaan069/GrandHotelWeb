/**
 * TabContext
 *
 * Sayfa tablarını Header (AppBar) içinde göstermek için kullanılan context.
 * Her sayfa kendi tab verilerini bu context üzerinden Header'a iletir.
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

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

  /* Fonksiyon state'i set edilirken updater sanılmasın diye () => handler ile sarılır; kimlikleri sabit */
  const setOnTabChangeStable = useCallback(
    (handler: ((index: number) => void) | null) => setOnTabChange(() => handler), [],
  );
  const setOnTabCloseStable = useCallback(
    (handler: ((e: React.MouseEvent, index: number) => void) | null) => setOnTabClose(() => handler), [],
  );
  const setOnBackToListStable = useCallback(
    (handler: (() => void) | null) => setOnBackToList(() => handler), [],
  );

  const value = useMemo(() => ({
    tabs,
    activeTabIndex,
    backLabel,
    setTabs,
    setActiveTabIndex,
    setBackLabel,
    onTabChange,
    setOnTabChange: setOnTabChangeStable,
    onTabClose,
    setOnTabClose: setOnTabCloseStable,
    onBackToList,
    setOnBackToList: setOnBackToListStable,
  }), [
    tabs, activeTabIndex, backLabel, onTabChange, onTabClose, onBackToList,
    setOnTabChangeStable, setOnTabCloseStable, setOnBackToListStable,
  ]);

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
