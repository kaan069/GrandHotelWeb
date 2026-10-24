/**
 * usePageTabs Hook
 *
 * Sayfaların tab verilerini Header'a (AppBar) iletmesini sağlar.
 * Sayfa mount olduğunda handler'ları kayıt eder, unmount olduğunda temizler.
 *
 * Handler'lar ref ile sarılarak sonsuz re-render döngüsü engellenir:
 * handler değiştiğinde context güncellenmez, sadece ref güncellenir.
 */

import { useEffect, useRef } from 'react';
import { useHeaderTabs, HeaderTab } from '../contexts/TabContext';

interface UsePageTabsOptions {
  tabs: HeaderTab[];
  activeTabIndex: number;
  onTabChange: (index: number) => void;
  onTabClose: (e: React.MouseEvent, index: number) => void;
  onBackToList: () => void;
  backLabel?: string;
}

const usePageTabs = ({
  tabs,
  activeTabIndex,
  onTabChange,
  onTabClose,
  onBackToList,
  backLabel = 'Listeye Dön',
}: UsePageTabsOptions) => {
  // Setter'lar sabit kimlikli (TabContext) → effect bağımlılığı olarak güvenli
  const {
    setTabs, setActiveTabIndex, setBackLabel, setOnTabChange, setOnTabClose, setOnBackToList,
  } = useHeaderTabs();

  // Handler'ları ref'te tut — her renderda güncellenir ama effect tetiklemez
  const onTabChangeRef = useRef(onTabChange);
  const onTabCloseRef = useRef(onTabClose);
  const onBackToListRef = useRef(onBackToList);

  onTabChangeRef.current = onTabChange;
  onTabCloseRef.current = onTabClose;
  onBackToListRef.current = onBackToList;

  // Sekmeler sadece key / etiket / rozet değişince iletilir (ikon her renderda yeni nesne)
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const tabsKey = JSON.stringify(tabs.map((t) => ({ key: t.key, label: t.label, badge: t.badge })));

  useEffect(() => {
    setTabs(tabsRef.current);
  }, [tabsKey, setTabs]);

  useEffect(() => {
    setActiveTabIndex(activeTabIndex);
  }, [activeTabIndex, setActiveTabIndex]);

  useEffect(() => {
    setBackLabel(backLabel);
  }, [backLabel, setBackLabel]);

  useEffect(() => {
    // Sabit wrapper fonksiyonlar — ref üzerinden son handler'ı çağırır
    setOnTabChange((index: number) => onTabChangeRef.current(index));
    setOnTabClose((e: React.MouseEvent, index: number) => onTabCloseRef.current(e, index));
    setOnBackToList(() => onBackToListRef.current());

    return () => {
      setTabs([]);
      setActiveTabIndex(-1);
      setOnTabChange(null);
      setOnTabClose(null);
      setOnBackToList(null);
    };
  }, [setTabs, setActiveTabIndex, setOnTabChange, setOnTabClose, setOnBackToList]);
};

export default usePageTabs;
