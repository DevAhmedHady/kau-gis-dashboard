import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import FlexSearch from 'flexsearch';
import type { Feature } from 'geojson';
import { featureCenter } from '../core/geo';
import { inspectFields } from '../core/fields';
import { useAppStore, type SearchHit } from '../core/store';
import { LAYER_BY_ID } from '../layers/layer-registry';
import { IconSearch } from './icons';

type SearchIndex = InstanceType<(typeof FlexSearch)['Document']>;

/** Layers load lazily, so anything past this per layer would blow up index build time. */
const MAX_DOCS_PER_LAYER = 20_000;

export default function Search() {
  const locale = useAppStore((s) => s.locale);
  const query = useAppStore((s) => s.searchQuery);
  const hits = useAppStore((s) => s.searchHits);
  const open = useAppStore((s) => s.commandOpen);
  const collections = useAppStore((s) => s.collections);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const docs = useRef(new Map<string, SearchHit>());
  const indexed = useRef(new Set<string>());
  const index = useRef<SearchIndex | null>(null);
  const ar = locale === 'ar';

  if (index.current === null) {
    index.current = new FlexSearch.Document<SearchHit, true>({
      tokenize: 'forward',
      cache: true,
      document: { id: 'id', index: ['title', 'meta', 'id'], store: true },
    });
  }

  // Index each layer as its data arrives — layers are fetched lazily, so eagerly
  // pulling every searchable layer here would defeat that entirely.
  useEffect(() => {
    const idx = index.current;
    if (!idx) return;
    for (const [layerId, fc] of Object.entries(collections)) {
      if (!fc || indexed.current.has(layerId)) continue;
      const declared = LAYER_BY_ID[layerId]?.metadata.searchableFields;
      const fields =
        declared?.length
          ? declared
          : inspectFields(fc)
              .filter((f) => f.type === 'text' || f.type === 'coded')
              .map((f) => f.name);
      if (!fields.length) continue;
      indexed.current.add(layerId);
      fc.features.slice(0, MAX_DOCS_PER_LAYER).forEach((f, i) => addDoc(idx, layerId, f, i, fields));
    }
  }, [collections]);

  useEffect(() => {
    if (open) {
      setActive(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!q || !index.current) {
      useAppStore.getState().setSearchHits([]);
      return;
    }
    const timer = window.setTimeout(() => {
      const raw = index.current!.search(q, 10);
      const seen = new Set<string>();
      const next: SearchHit[] = [];
      for (const field of raw) {
        for (const id of field.result) {
          const key = String(id);
          if (seen.has(key)) continue;
          seen.add(key);
          const hit = docs.current.get(key);
          if (hit) next.push(hit);
        }
      }
      useAppStore.getState().setSearchHits(next);
      setActive(0);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [query]);

  function addDoc(
    idx: SearchIndex,
    layerId: string,
    feature: Feature,
    i: number,
    fields: string[],
  ): void {
    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const title = String(
      props.name_en ?? props.name_ar ?? props.description ?? props[fields[0]] ?? `${layerId}-${i}`,
    );
    const meta = [LAYER_BY_ID[layerId]?.title.en, ...fields.map((f) => props[f])]
      .filter(Boolean)
      .join(' · ');
    const hit: SearchHit = {
      id: `${layerId}:${String(feature.id ?? i)}`,
      layerId,
      title,
      meta,
      center: featureCenter(feature),
      properties: props,
    };
    docs.current.set(hit.id, hit);
    idx.add({ ...hit, title: `${hit.title} ${meta}` });
  }

  function select(hit: SearchHit): void {
    const store = useAppStore.getState();
    store.selectFeature({ layerId: hit.layerId, properties: hit.properties });
    store.requestFlyTo(hit.center, 18);
    store.setSearchQuery('');
    store.setSearchHits([]);
    store.setCommandOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(0, hits.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && hits[active]) {
      e.preventDefault();
      select(hits[active]);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={ar ? 'بحث' : 'Search'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) useAppStore.getState().setCommandOpen(false);
          }}
        >
          <motion.div
            className="palette"
            initial={{ y: -16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -12, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className="palette__input-row">
              <IconSearch />
              <input
                ref={inputRef}
                id="spatial-search"
                type="search"
                value={query}
                placeholder={ar ? 'ابحث عن المباني، المواقف، القطاعات…' : 'Search buildings, parking, zones…'}
                aria-label={ar ? 'بحث مكاني' : 'Spatial search'}
                onChange={(e) => useAppStore.getState().setSearchQuery(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </div>
            <div className="palette__results">
              {hits.length === 0 ? (
                <div className="palette__empty">
                  {query.trim()
                    ? ar
                      ? 'لا توجد نتائج'
                      : 'No matching features'
                    : ar
                      ? 'ابدأ بالكتابة للبحث في طبقات الحرم'
                      : 'Start typing to search campus layers'}
                </div>
              ) : (
                hits.map((hit, i) => (
                  <button
                    key={hit.id}
                    type="button"
                    className={`palette__hit${i === active ? ' active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => select(hit)}
                  >
                    <div className="palette__name">{hit.title}</div>
                    <div className="palette__meta">{hit.meta}</div>
                  </button>
                ))
              )}
            </div>
            <div className="palette__footer">
              <span>
                <kbd>↵</kbd> {ar ? 'اختيار' : 'Select'}
              </span>
              <span>
                <kbd>↑↓</kbd> {ar ? 'تنقل' : 'Navigate'}
              </span>
              <span>
                <kbd>Esc</kbd> {ar ? 'إغلاق' : 'Close'}
              </span>
              <span>
                <kbd>+/−</kbd> {ar ? 'تكبير' : 'Zoom'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
