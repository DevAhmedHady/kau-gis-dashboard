import { fieldAlias, formatFieldValue, popupTitle, visibleProperties } from '../core/fields';
import { LAYER_BY_ID } from '../layers/layer-registry';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Professional attribute popup HTML from the feature's actual properties. */
export function renderFeaturePopupHtml(
  layerId: string,
  props: Record<string, unknown>,
  locale: 'en' | 'ar',
): string {
  const layer = LAYER_BY_ID[layerId];
  const title = popupTitle(props, layer?.title[locale] ?? layerId);
  const rows = visibleProperties(props)
    .map(([key, value]) => {
      const label = fieldAlias(key, locale);
      const text = formatFieldValue(key, value, locale);
      return `<div class="kau-popup__row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(text)}</dd></div>`;
    })
    .join('');

  return `<div class="kau-popup">
    <div class="kau-popup__title">${escapeHtml(title)}</div>
    ${layer ? `<div class="kau-popup__layer">${escapeHtml(layer.title[locale])}</div>` : ''}
    <dl class="kau-popup__attrs">${rows}</dl>
  </div>`;
}
