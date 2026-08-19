import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function IconSearch(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
export function IconChart(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" {...base} {...p}>
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19V3" />
    </svg>
  );
}
export function IconMap(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" {...base} {...p}>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}
export function IconBuilding(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" {...base} {...p}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01" />
    </svg>
  );
}
export function IconRoad(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" {...base} {...p}>
      <path d="M4 21 8 3h8l4 18" />
      <path d="M12 3v3M12 10v3M12 17v3" />
    </svg>
  );
}
export function IconZap(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" {...base} {...p}>
      <polygon points="13 2 4 14 12 14 11 22 20 10 12 10 13 2" />
    </svg>
  );
}
export function IconLeaf(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" {...base} {...p}>
      <path d="M11 20A7 7 0 0 1 4 13C4 7 11 4 20 4c0 9-3 16-9 16" />
      <path d="M7 13c3-1 6-4 8-8" />
    </svg>
  );
}
export function IconSun(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" {...base} {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
export function IconMoon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" {...base} {...p}>
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
    </svg>
  );
}
export function IconChevron(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" {...base} {...p}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
export function IconX(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" {...base} {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
export function IconCopy(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" {...base} {...p}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M4 16V6a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
export function IconCheck(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" {...base} {...p}>
      <path d="M5 12 9 16l10-10" />
    </svg>
  );
}
export function IconGrip(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" {...base} {...p}>
      <circle cx="9" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="17" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconEye(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" {...base} {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
export function IconEyeOff(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" {...base} {...p}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4" />
      <path d="M9.9 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 3.9" />
      <path d="M6.1 6.1A18 18 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 3.2-.5" />
    </svg>
  );
}
export function IconPanel(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" {...base} {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </svg>
  );
}
export function IconTrendUp(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" {...base} {...p}>
      <path d="M4 16 10 10l4 4 6-7" />
      <path d="M16 7h4v4" />
    </svg>
  );
}
export function IconTrendDown(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" {...base} {...p}>
      <path d="M4 8l6 6 4-4 6 7" />
      <path d="M16 17h4v-4" />
    </svg>
  );
}
export function IconMinus(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" {...base} {...p}>
      <path d="M5 12h14" />
    </svg>
  );
}
export function IconPin(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" {...base} {...p}>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}
export function IconKbd(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" {...base} {...p}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 12h.01M11 12h2M16 12h.01" />
    </svg>
  );
}

export function IconFilter(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" {...base} {...p}>
      <polygon points="4 5 20 5 13 13 13 19 11 20 11 13 4 5" />
    </svg>
  );
}
export function IconLocate(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" {...base} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}
export function IconPlan(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" {...base} {...p}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16M4 16h16M10 4v16" />
    </svg>
  );
}

export const GROUP_ICONS = {
  adm: IconMap,
  bld: IconBuilding,
  plan: IconPlan,
  net: IconRoad,
  utl: IconZap,
  env: IconLeaf,
} as const;
