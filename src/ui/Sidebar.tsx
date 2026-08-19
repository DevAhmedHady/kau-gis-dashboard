import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { collectionBBox } from '../core/geo';
import { featureMatchesFilter } from '../core/fields';
import { useAppStore } from '../core/store';
import { GROUP_META, LAYER_REGISTRY } from '../layers/layer-registry';
import { ensureLoaded } from '../layers/layer-controller';
import type { LayerGroup } from '../types/kau-spatial-types';
import {
  GROUP_ICONS,
  IconChart,
  IconChevron,
  IconEye,
  IconEyeOff,
  IconFilter,
  IconGrip,
  IconLocate,
  IconPanel,
  IconSearch,
} from './icons';
import LayerFilterPanel from './LayerFilter';
import Metrics from './Metrics';

const GROUPS: LayerGroup[] = ['adm', 'bld', 'plan', 'net', 'utl', 'env'];

const railStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const railItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function Sidebar() {
  const locale = useAppStore((s) => s.locale);
  const layers = useAppStore((s) => s.layers);
  const groups = useAppStore((s) => s.groups);
  const filters = useAppStore((s) => s.filters);
  const analyticsOpen = useAppStore((s) => s.analyticsOpen);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const [filterLayer, setFilterLayer] = useState<string | null>(null);
  const byId = useMemo(() => Object.fromEntries(layers.map((l) => [l.id, l])), [layers]);
  const ar = locale === 'ar';
  const filterCount = Object.keys(filters).length;

  async function zoomToLayer(layerId: string): Promise<void> {
    await ensureLoaded(layerId);
    const store = useAppStore.getState();
    const bbox = collectionBBox(store.collections[layerId], (f) =>
      featureMatchesFilter(f, store.filters[layerId]),
    );
    if (bbox) store.requestFitBounds(bbox);
  }

  return (
    <motion.aside
      className={`sidebar${collapsed ? ' collapsed' : ''}`}
      animate={{ width: collapsed ? 64 : 320 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      aria-label={ar ? 'طبقات' : 'Layers'}
    >
      <div className="sidebar__top">
        <button
          type="button"
          className="icon-btn"
          aria-label={collapsed ? (ar ? 'توسيع الشريط' : 'Expand sidebar') : ar ? 'طي الشريط' : 'Collapse sidebar'}
          onClick={() => useAppStore.getState().toggleSidebar()}
        >
          <IconPanel />
        </button>
        {!collapsed && <span className="sidebar__header">{ar ? 'التحكم' : 'Controls'}</span>}
      </div>

      <div className="sidebar__scroll">
        {collapsed ? (
          <motion.div variants={railStagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <motion.button
              variants={railItem}
              type="button"
              className="icon-btn rail-btn"
              aria-label={ar ? 'بحث' : 'Search'}
              onClick={() => useAppStore.getState().setCommandOpen(true)}
            >
              <IconSearch />
            </motion.button>
            <motion.button
              variants={railItem}
              type="button"
              className={`icon-btn rail-btn${analyticsOpen ? ' active' : ''}`}
              aria-label={ar ? 'التحليلات' : 'Analytics'}
              onClick={() => useAppStore.getState().toggleAnalytics()}
            >
              <IconChart />
            </motion.button>
            {GROUPS.map((group) => {
              const Icon = GROUP_ICONS[group];
              return (
                <motion.button
                  key={group}
                  variants={railItem}
                  type="button"
                  className={`icon-btn rail-btn${groups[group] ? ' active' : ''}`}
                  title={GROUP_META[group][locale]}
                  aria-label={GROUP_META[group][locale]}
                  onClick={() => useAppStore.getState().toggleGroup(group)}
                >
                  <Icon />
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          <>
            <button
              type="button"
              className="search-trigger"
              onClick={() => useAppStore.getState().setCommandOpen(true)}
            >
              <IconSearch />
              <span>{ar ? 'بحث في الحرم…' : 'Search campus…'}</span>
              <kbd>⌘K</kbd>
            </button>

            <Metrics />

            <button
              type="button"
              className={`btn analytics-toggle${analyticsOpen ? ' active' : ''}`}
              onClick={() => useAppStore.getState().toggleAnalytics()}
            >
              <IconChart />
              {ar ? 'التحليلات المكانية' : 'Spatial Analytics'}
            </button>

            {filterCount > 0 && (
              <button
                type="button"
                className="btn filter-clear-all"
                onClick={() => {
                  useAppStore.getState().clearAllFilters();
                  setFilterLayer(null);
                }}
              >
                {ar ? `مسح كل عوامل التصفية (${filterCount})` : `Clear all filters (${filterCount})`}
              </button>
            )}

            <div id="layerTree">
              {GROUPS.map((group) => {
                const items = LAYER_REGISTRY.filter((l) => l.group === group);
                if (!items.length) return null;
                const isFolded = folded[group];
                const Icon = GROUP_ICONS[group];
                const visibleCount = items.filter((l) => byId[l.id]?.visible).length;
                return (
                  <section key={group} className="sidebar__section group">
                    <button
                      type="button"
                      className={`group__toggle${isFolded ? ' collapsed' : ''}`}
                      onClick={() => setFolded((c) => ({ ...c, [group]: !c[group] }))}
                    >
                      <IconChevron className="chevron" />
                      <span className="group__icon">
                        <Icon />
                      </span>
                      <input
                        type="checkbox"
                        checked={groups[group]}
                        onChange={(e) => {
                          e.stopPropagation();
                          useAppStore.getState().toggleGroup(group);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={GROUP_META[group][locale]}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <span className="group__label">
                        {GROUP_META[group][locale]}
                        <span style={{ color: 'var(--text-faint)', fontWeight: 500 }}>
                          {locale === 'en' ? ` / ${GROUP_META[group].ar}` : ` / ${GROUP_META[group].en}`}
                        </span>
                      </span>
                      <span className="group__badge">
                        {visibleCount}/{items.length}
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {!isFolded && (
                        <motion.div
                          className="group__layers"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          style={{ overflow: 'hidden' }}
                        >
                          {items.map((layer) => {
                            const state = byId[layer.id];
                            const visible = state?.visible ?? false;
                            const opacity = state?.opacity ?? 1;
                            const activeFilter = filters[layer.id];
                            const filterOpen = filterLayer === layer.id;
                            return (
                              <div key={layer.id} className={`layer${activeFilter ? ' filtered' : ''}`} draggable={false}>
                                <div className="layer__row">
                                  <span className="layer__grip" aria-hidden>
                                    <IconGrip />
                                  </span>
                                  <button
                                    type="button"
                                    className={`layer__eye${visible ? '' : ' off'}`}
                                    aria-pressed={visible}
                                    aria-label={`${layer.title[locale]} ${visible ? 'visible' : 'hidden'}`}
                                    onClick={() => useAppStore.getState().setLayerVisible(layer.id, !visible)}
                                  >
                                    {visible ? <IconEye /> : <IconEyeOff />}
                                  </button>
                                  <div className="layer__info">
                                    <div className="layer__name">
                                      {layer.title[locale]}
                                      {activeFilter && (
                                        <span className="layer__filter-dot" title={ar ? 'عامل تصفية نشط' : 'Filter active'} />
                                      )}
                                    </div>
                                    <div className="layer__meta">
                                      {activeFilter
                                        ? `${activeFilter.field} IN (${activeFilter.values.length})`
                                        : `${layer.geometryType} · ${layer.source.type.toUpperCase()}`}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className={`layer__tool${filterOpen || activeFilter ? ' active' : ''}`}
                                    aria-label={ar ? 'تصفية الطبقة' : 'Filter layer'}
                                    title={ar ? 'تصفية' : 'Filter'}
                                    onClick={() => setFilterLayer(filterOpen ? null : layer.id)}
                                  >
                                    <IconFilter />
                                  </button>
                                  <button
                                    type="button"
                                    className="layer__tool"
                                    aria-label={ar ? 'تكبير للطبقة' : 'Zoom to layer'}
                                    title={ar ? 'تكبير للطبقة' : 'Zoom to layer'}
                                    onClick={() => void zoomToLayer(layer.id)}
                                  >
                                    <IconLocate />
                                  </button>
                                  <div className="layer__opacity">
                                    <input
                                      type="range"
                                      min={0}
                                      max={1}
                                      step={0.05}
                                      value={opacity}
                                      disabled={!visible}
                                      onChange={(e) =>
                                        useAppStore.getState().setOpacity(layer.id, Number(e.target.value))
                                      }
                                      aria-label={`${layer.title[locale]} opacity`}
                                    />
                                    <span className="layer__pct">{Math.round(opacity * 100)}</span>
                                  </div>
                                </div>
                                {filterOpen && <LayerFilterPanel layerId={layer.id} ar={ar} />}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </motion.aside>
  );
}
