import { motion } from 'framer-motion';
import { BASEMAPS } from '../core/basemaps';
import { useAppStore } from '../core/store';
import { IconMoon, IconPin, IconSun } from './icons';

function fmtCoord(n: number, pos: string, neg: string): string {
  const hemi = n >= 0 ? pos : neg;
  return `${Math.abs(n).toFixed(4)}°${hemi}`;
}

export default function Header() {
  const locale = useAppStore((s) => s.locale);
  const basemap = useAppStore((s) => s.basemap);
  const theme = useAppStore((s) => s.theme);
  const mapView = useAppStore((s) => s.mapView);
  const ar = locale === 'ar';

  return (
    <motion.header
      className="header glass"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
    >
      <div className="header__brand">
        <span className="header__mark" aria-hidden />
        <div>
          <div className="header__title">{ar ? 'لوحة جامعة الملك عبد العزيز المكانية' : 'KAU Spatial Dashboard'}</div>
          <div className="header__sub">{ar ? 'جامعة الملك عبد العزيز' : 'King Abdulaziz University'}</div>
        </div>
      </div>

      <div className="header__extent" title={ar ? 'نطاق الخريطة الحي' : 'Live map extent'}>
        <span className="header__live" aria-hidden />
        <IconPin />
        {mapView ? (
          <span>
            {fmtCoord(mapView.lat, 'N', 'S')}&nbsp;&nbsp;{fmtCoord(mapView.lng, 'E', 'W')}
            <span style={{ opacity: 0.55 }}> · z{mapView.zoom.toFixed(1)}</span>
          </span>
        ) : (
          <span>{ar ? 'جاري التحميل…' : 'Acquiring view…'}</span>
        )}
      </div>

      <div className="header__actions">
        <div className="segmented" role="group" aria-label={ar ? 'الخريطة الأساسية' : 'Basemap'}>
          {BASEMAPS.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`segmented__btn${basemap === b.id ? ' active' : ''}`}
              onClick={() => useAppStore.getState().setBasemap(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="locale-switcher" role="group" aria-label="Locale">
          <button
            type="button"
            className={`btn${locale === 'en' ? ' active' : ''}`}
            onClick={() => useAppStore.getState().setLocale('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={`btn${locale === 'ar' ? ' active' : ''}`}
            onClick={() => useAppStore.getState().setLocale('ar')}
          >
            ع
          </button>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label={theme === 'dark' ? (ar ? 'الوضع الفاتح' : 'Light mode') : ar ? 'الوضع الداكن' : 'Dark mode'}
          onClick={() => useAppStore.getState().toggleTheme()}
        >
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
      </div>
    </motion.header>
  );
}
