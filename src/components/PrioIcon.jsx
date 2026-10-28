import { PRIO } from '../utils';

export default function PrioIcon({ p }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={PRIO[p].color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={`Priorità ${PRIO[p].label.toLowerCase()}`}>
      {p === 'ALTA' && <path d="M3 7l5-4 5 4M3 12l5-4 5 4" />}
      {p === 'MEDIA' && <path d="M3 6h10M3 10h10" />}
      {p === 'BASSA' && <path d="M3 5l5 4 5-4" />}
    </svg>
  );
}
