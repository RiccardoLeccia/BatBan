import { STATI, PRIO, CATEGORIE, fmtData, residuo } from '../utils';
import Avatar from './Avatar';
import PrioIcon from './PrioIcon';

export default function TicketCard({ ticket: t, dragging, onDragStart, onDragEnd, onMove, onDelete }) {
  const i = STATI.findIndex((s) => s.id === t.stato);

  return (
    <article
      className={`card ${t.slaScaduto ? 'sla-scaduto' : ''} ${dragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(t.id)); onDragStart(); }}
      onDragEnd={onDragEnd}
    >
      <h3>{t.titolo}</h3>
      <p className="desc">{t.descrizione}</p>
      <div className="chips">
        <span className="chip" data-cat={t.categoria}>{CATEGORIE[t.categoria]}</span>
        <span className="cliente">{t.cliente}</span>
      </div>
      <div className={`scadenza ${t.slaScaduto ? 'late' : ''}`}>
        <span>{t.slaScaduto ? 'SLA scaduto' : fmtData(t.scadenza)}</span>
        <span>{residuo(t)}</span>
      </div>
      <div className="card-foot">
        <div className="foot-left"><span className="key">HD-{t.id}</span><PrioIcon p={t.priorita} /></div>
        <div className="foot-right">
          <div className="actions">
            <button type="button" aria-label="Sposta indietro" disabled={i === 0} onClick={() => onMove(t.id, STATI[i - 1].id)}>&lsaquo;</button>
            <button type="button" aria-label="Sposta avanti" disabled={i === STATI.length - 1} onClick={() => onMove(t.id, STATI[i + 1].id)}>&rsaquo;</button>
            <button type="button" aria-label="Elimina ticket" className="danger" onClick={() => onDelete(t)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
            </button>
          </div>
          <Avatar nome={t.assegnatario} />
        </div>
      </div>
    </article>
  );
}
