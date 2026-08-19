import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { fieldAlias, formatFieldValue, popupTitle, visibleProperties } from '../core/fields';
import { useAppStore } from '../core/store';
import { LAYER_BY_ID } from '../layers/layer-registry';
import { IconCheck, IconCopy, IconX } from './icons';

type Group = { title: string; entries: [string, unknown][] };

const IDENTITY = /(_id$|^id$|_no$|name_|title)/i;
const SPATIAL = /(area|length|capacity|floor|depth|width|height|elevation|sqm|diameter|invert|range)/i;
const STATUS = /(status|type|usage|category|class|material|species|land_use|access|network|branch|tenure|ownership|contract|lamp|surface|shaded|accessible)/i;

function groupProperties(props: Record<string, unknown>, ar: boolean): Group[] {
  const identity: [string, unknown][] = [];
  const spatial: [string, unknown][] = [];
  const attrs: [string, unknown][] = [];
  const other: [string, unknown][] = [];
  for (const entry of visibleProperties(props)) {
    const [k] = entry;
    if (IDENTITY.test(k)) identity.push(entry);
    else if (SPATIAL.test(k)) spatial.push(entry);
    else if (STATUS.test(k)) attrs.push(entry);
    else other.push(entry);
  }
  return [
    { title: ar ? 'الهوية' : 'Identity', entries: identity },
    { title: ar ? 'التصنيف' : 'Attributes', entries: attrs },
    { title: ar ? 'المقاييس' : 'Metrics', entries: spatial },
    { title: ar ? 'أخرى' : 'Other', entries: other },
  ].filter((g) => g.entries.length);
}

export default function Inspector() {
  const selected = useAppStore((s) => s.selected);
  const locale = useAppStore((s) => s.locale);
  const [copied, setCopied] = useState<string | null>(null);
  const ar = locale === 'ar';

  const layer = selected ? LAYER_BY_ID[selected.layerId] : undefined;
  const props = selected?.properties ?? {};
  const title = popupTitle(props, ar ? 'تفاصيل المعلم' : 'Feature Details');
  const groups = useMemo(() => groupProperties(props, ar), [props, ar]);

  async function copy(key: string, text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <AnimatePresence>
      {selected && (
        <motion.div
          className="inspector"
          role="dialog"
          aria-label={ar ? 'خصائص المعلم' : 'Feature inspector'}
          initial={{ y: '110%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '110%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        >
          <div className="inspector__header">
            <h3>{title}</h3>
            <div className="inspector__tools">
              <button
                type="button"
                className={`copy-btn${copied === '__all' ? ' copied' : ''}`}
                aria-label={ar ? 'نسخ الكل' : 'Copy all'}
                title={ar ? 'نسخ الكل' : 'Copy JSON'}
                onClick={() => copy('__all', JSON.stringify(props, null, 2))}
              >
                {copied === '__all' ? <IconCheck /> : <IconCopy />}
              </button>
              <button
                type="button"
                className="inspector__close"
                aria-label={ar ? 'إغلاق' : 'Close'}
                onClick={() => useAppStore.getState().selectFeature(null)}
              >
                <IconX />
              </button>
            </div>
          </div>
          {layer && (
            <div className="inspector__summary">
              {layer.title[locale]} · {layer.geometryType}
            </div>
          )}
          {groups.map((g) => (
            <section key={g.title} className="inspector__group">
              <div className="inspector__group-title">{g.title}</div>
              <dl className="inspector__attr">
                {g.entries.map(([key, value]) => {
                  const text = formatFieldValue(key, value, locale);
                  return (
                    <span key={key} style={{ display: 'contents' }}>
                      <dt>{fieldAlias(key, locale)}</dt>
                      <dd>{text}</dd>
                      <button
                        type="button"
                        className={`copy-btn${copied === key ? ' copied' : ''}`}
                        aria-label={`${ar ? 'نسخ' : 'Copy'} ${key}`}
                        onClick={() => copy(key, text)}
                      >
                        {copied === key ? <IconCheck /> : <IconCopy />}
                      </button>
                    </span>
                  );
                })}
              </dl>
            </section>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
