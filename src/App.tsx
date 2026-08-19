import { useEffect } from 'react';
import { useAppStore } from './core/store';
import AnalyticsPanel from './ui/AnalyticsPanel';
import Header from './ui/Header';
import Inspector from './ui/Inspector';
import MapView from './ui/MapView';
import Search from './ui/Search';
import Sidebar from './ui/Sidebar';

export default function App() {
  const locale = useAppStore((s) => s.locale);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      const store = useAppStore.getState();

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        store.setCommandOpen(!store.commandOpen);
        return;
      }
      if (e.key === 'Escape') {
        if (store.commandOpen) store.setCommandOpen(false);
        else if (store.selected) store.selectFeature(null);
        else if (store.analyticsOpen) store.setAnalyticsOpen(false);
        return;
      }
      if (inField) return;
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        store.requestZoom(1);
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        store.requestZoom(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app" data-theme={theme} dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}>
      <div className="viewport">
        <Header />
        <MapView />
        <AnalyticsPanel />
        <Inspector />
        <Search />
      </div>
      <Sidebar />
    </div>
  );
}
