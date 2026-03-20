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
  const ctx = useHeaderTabs();

  // Handler'ları ref'te tut — her renderda güncellenir ama effect tetiklemez
  const onTabChangeRef = useRef(onTabChange);
  const onTabCloseRef = useRef(onTabClose);
  const onBackToListRef = useRef(onBackToList);

  onTabChangeRef.current = onTabChange;
  onTabCloseRef.current = onTabClose;
  onBackToListRef.current = onBackToList;

  useEffect(() => {
    ctx.setTabs(tabs);
  }, [JSON.stringify(tabs.map((t) => ({ key: t.key, label: t.label, badge: t.badge })))]);

  useEffect(() => {
    ctx.setActiveTabIndex(activeTabIndex);
  }, [activeTabIndex]);

  useEffect(() => {
    ctx.setBackLabel(backLabel);
  }, [backLabel]);

  useEffect(() => {
    // Sabit wrapper fonksiyonlar — ref üzerinden son handler'ı çağırır
    ctx.setOnTabChange((index: number) => onTabChangeRef.current(index));
    ctx.setOnTabClose((e: React.MouseEvent, index: number) => onTabCloseRef.current(e, index));
    ctx.setOnBackToList(() => onBackToListRef.current());

    return () => {
      ctx.setTabs([]);
      ctx.setActiveTabIndex(-1);
      ctx.setOnTabChange(null);
      ctx.setOnTabClose(null);
      ctx.setOnBackToList(null);
    };
  }, []);
};

export default usePageTabs;
