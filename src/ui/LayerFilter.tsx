import { useEffect, useMemo, useState } from 'react';
import { inspectFields, uniqueFieldValues, fieldAlias } from '../core/fields';
import { useAppStore, type LayerFilter } from '../core/store';
import { ensureLoaded } from '../layers/layer-controller';

interface Props {
  layerId: string;
  ar: boolean;
}

export default function LayerFilterPanel({ layerId, ar }: Props) {
  const locale = ar ? 'ar' : 'en';
  const collection = useAppStore((s) => s.collections[layerId]);
  const applied = useAppStore((s) => s.filters[layerId]);
  const loading = useAppStore((s) => s.loadingLayers.includes(layerId));

  const fields = useMemo(() => inspectFields(collection), [collection]);
  const [field, setField] = useState(applied?.field ?? fields[0]?.name ?? '');
  const [selected, setSelected] = useState<Array<string | number>>(applied?.values ?? []);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void ensureLoaded(layerId);
  }, [layerId]);

  useEffect(() => {
    if (!field && fields[0]) setField(fields[0].name);
  }, [field, fields]);

  const values = useMemo(() => uniqueFieldValues(collection, field), [collection, field]);
  const listed = useMemo(() => values.slice(0, 800), [values]);
  const truncated = values.length > 800;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listed;
    return listed.filter((v) => String(v).toLowerCase().includes(q));
  }, [listed, query]);

  const schema = fields.find((f) => f.name === field);
  const selectedSet = useMemo(() => new Set(selected.map((v) => `${typeof v}:${v}`)), [selected]);

  function toggle(value: string | number): void {
    const key = `${typeof value}:${value}`;
    setSelected((cur) =>
      cur.some((v) => `${typeof v}:${v}` === key) ? cur.filter((v) => `${typeof v}:${v}` !== key) : [...cur, value],
    );
  }

  function apply(): void {
    const next: LayerFilter | null = field && selected.length ? { field, values: selected } : null;
    useAppStore.getState().setLayerFilter(layerId, next);
  }

  function clear(): void {
    setSelected([]);
    useAppStore.getState().clearLayerFilter(layerId);
  }

  return (
    <div className="layer-filter" onClick={(e) => e.stopPropagation()}>
      <div className="layer-filter__row">
        <label className="layer-filter__label" htmlFor={`flt-field-${layerId}`}>
          {ar ? 'الحقل' : 'Field'}
        </label>
        <select
          id={`flt-field-${layerId}`}
          value={field}
          disabled={loading || !fields.length}
          onChange={(e) => {
            setField(e.target.value);
            setSelected([]);
            setQuery('');
          }}
        >
          {fields.map((f) => (
            <option key={f.name} value={f.name}>
              {fieldAlias(f.name, locale)} ({f.type})
            </option>
          ))}
        </select>
      </div>

      {schema && (
        <div className="layer-filter__meta">
          {schema.uniqueCount} {ar ? 'قيمة' : 'values'} · {schema.type}
          {truncated ? (ar ? ' (أول 800)' : ' (first 800)') : ''}
        </div>
      )}

      {listed.length > 12 && (
        <input
          className="layer-filter__search"
          type="search"
          value={query}
          placeholder={ar ? 'بحث في القيم…' : 'Search values…'}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      <div className="layer-filter__values" role="group" aria-label={ar ? 'القيم' : 'Values'}>
        {loading && !collection ? (
          <div className="layer-filter__empty">{ar ? 'جاري التحميل…' : 'Loading fields…'}</div>
        ) : !fields.length ? (
          <div className="layer-filter__empty">{ar ? 'لا توجد حقول في هذه الطبقة' : 'No attributes on this layer'}</div>
        ) : filtered.length === 0 ? (
          <div className="layer-filter__empty">{ar ? 'لا توجد قيم' : 'No values'}</div>
        ) : (
          filtered.map((value) => {
            const key = `${typeof value}:${value}`;
            const id = `flt-${layerId}-${key}`;
            return (
              <label key={key} className="layer-filter__option" htmlFor={id}>
                <input
                  id={id}
                  type="checkbox"
                  checked={selectedSet.has(key)}
                  onChange={() => toggle(value)}
                />
                <span>{String(value)}</span>
              </label>
            );
          })
        )}
      </div>

      <div className="layer-filter__actions">
        <button type="button" className="btn layer-filter__apply" onClick={apply} disabled={!field}>
          {ar ? 'تطبيق' : 'Apply'}
        </button>
        <button type="button" className="btn layer-filter__clear" onClick={clear}>
          {ar ? 'مسح' : 'Clear'}
        </button>
        <button
          type="button"
          className="btn layer-filter__all"
          onClick={() => setSelected(filtered.slice())}
          disabled={!filtered.length}
        >
          {ar ? 'تحديد الظاهر' : 'Select visible'}
        </button>
      </div>
    </div>
  );
}
