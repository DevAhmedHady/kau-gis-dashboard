import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useAppStore } from '../core/store';
import BuildingAreaChart from './BuildingAreaChart';
import GreenAreaChart from './GreenAreaChart';
import { IconX } from './icons';
import NetworkLengthChart from './NetworkLengthChart';
import SoakawayChart from './SoakawayChart';

const TABS = [
  { id: 'buildings', en: 'Buildings', ar: 'المباني' },
  { id: 'green', en: 'Green', ar: 'خضراء' },
  { id: 'soakaways', en: 'Soakaways', ar: 'تصريف' },
  { id: 'networks', en: 'Networks', ar: 'شبكات' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AnalyticsPanel() {
  const locale = useAppStore((s) => s.locale);
  const open = useAppStore((s) => s.analyticsOpen);
  const [tab, setTab] = useState<TabId>('buildings');
  const ar = locale === 'ar';

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="analytics"
          role="complementary"
          aria-label={ar ? 'لوحة التحليلات' : 'Analytics dashboard'}
          initial={{ x: ar ? 24 : -24, opacity: 0, scale: 0.98 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: ar ? 16 : -16, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        >
          <header className="analytics__header">
            <div>
              <h3>{ar ? 'التحليلات المكانية' : 'Spatial Analytics'}</h3>
              <p className="analytics__hint">{ar ? 'محدّث حسب نطاق الخريطة' : 'Filtered to live map extent'}</p>
            </div>
            <button
              type="button"
              className="inspector__close"
              aria-label={ar ? 'إغلاق' : 'Close'}
              onClick={() => useAppStore.getState().setAnalyticsOpen(false)}
            >
              <IconX />
            </button>
          </header>
          <nav className="analytics__tabs" aria-label={ar ? 'مقاييس' : 'Metrics'}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`analytics__tab${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {tab === t.id && (
                  <motion.span className="analytics__tab-bg" layoutId="analytics-tab" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                )}
                {t[locale]}
              </button>
            ))}
          </nav>
          <div className="analytics__body">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {tab === 'buildings' && <BuildingAreaChart />}
                {tab === 'green' && <GreenAreaChart />}
                {tab === 'soakaways' && <SoakawayChart />}
                {tab === 'networks' && <NetworkLengthChart />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
