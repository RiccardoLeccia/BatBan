import { PRIO } from '../utils';
import PrioIcon from './PrioIcon';

export default function Toolbar({ clienti, cliente, onChange, totale, onNew }) {
  return (
    <>
      <div className="page-head">
        <div><h1 className="title">Board</h1><p className="muted">Ticket di assistenza per cliente</p></div>
        <div className="head-right">
          <button type="button" className="btn btn-primary" onClick={onNew}>Nuovo ticket</button>
          <div className="legend">
            {Object.entries(PRIO).map(([k, v]) => <span key={k}><PrioIcon p={k} />{v.label}, {v.soglia}</span>)}
          </div>
        </div>
      </div>
      <div className="toolbar">
        <div className="toolbar-left">
          <select aria-label="Filtra per cliente" value={cliente} onChange={(e) => onChange(e.target.value)}>
            <option value="">Tutti i clienti</option>
            {clienti.map((c) => <option key={c}>{c}</option>)}
          </select>
          {cliente && <button type="button" className="link" onClick={() => onChange('')}>Rimuovi filtro</button>}
          <span className="muted">{totale} ticket</span>
        </div>
      </div>
    </>
  );
}
