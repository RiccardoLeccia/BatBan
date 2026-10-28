import { useState } from 'react';
import Avatar from '../components/Avatar';
import { STATI, PRIO, residuo, fmtOre } from '../utils';

const GRIGIO = '#6b7785';

function Torta({ fette }) {
  const tot = fette.reduce((s, x) => s + x.n, 0);
  const R = 90;
  let a = -Math.PI / 2;
  return (
    <svg viewBox="-100 -100 200 200" role="img" aria-label="Ticket per stato e scadenza" className="pie">
      {fette.length === 1 ? <circle r={R} fill={fette[0].colore} /> : fette.map((s, i) => {
        const b = a + (s.n / tot) * 2 * Math.PI;
        const d = `M0 0L${Math.cos(a) * R} ${Math.sin(a) * R}A${R} ${R} 0 ${b - a > Math.PI ? 1 : 0} 1 ${Math.cos(b) * R} ${Math.sin(b) * R}Z`;
        a = b;
        return <path key={i} d={d} fill={s.colore} stroke="#161a1d" strokeWidth="2" />;
      })}
    </svg>
  );
}

export default function Dashboard({ tickets, dipendenti, onNew }) {
  const [sel, setSel] = useState(null);
  const dip = dipendenti.find((d) => d.id === sel);
  const suoi = dip ? tickets.filter((t) => t.assegnatarioId === dip.id) : [];
  const aperti = suoi.filter((t) => t.stato !== 'RESOLVED').sort((a, b) => a.oreResidue - b.oreResidue);
  const max = Math.max(24, ...aperti.map((t) => t.oreResidue));

  const fette = STATI.flatMap((s) =>
    s.id === 'RESOLVED'
      ? [{ stato: s.label, prio: null, colore: GRIGIO, n: suoi.filter((t) => t.stato === s.id).length }]
      : Object.keys(PRIO).map((p) => ({ stato: s.label, prio: PRIO[p].label, colore: PRIO[p].color, n: suoi.filter((t) => t.stato === s.id && t.priorita === p).length }))
  ).filter((f) => f.n > 0);

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="title">Dipendenti</h1><p className="muted">Seleziona una persona per vedere il suo carico di lavoro</p></div>
        <div className="head-right"><button type="button" className="btn btn-primary" onClick={onNew}>Nuovo dipendente</button></div>
      </div>
      <div className="people">
        {dipendenti.map((d) => {
          const n = tickets.filter((t) => t.assegnatarioId === d.id && t.stato !== 'RESOLVED').length;
          return (
            <button key={d.id} type="button" className="person" aria-pressed={sel === d.id} onClick={() => setSel(sel === d.id ? null : d.id)}>
              <Avatar nome={d.nome} size={40} />
              <span className="info"><b>{d.nome}</b><small>{d.specializzazione}</small></span>
              <em>{n}</em>
            </button>
          );
        })}
      </div>

      {!dip && <p className="muted">Seleziona un dipendente per vedere i suoi ticket.</p>}
      {dip && suoi.length === 0 && <p className="muted">{dip.nome} non ha ticket assegnati.</p>}

      {suoi.length > 0 && (
        <div className="charts">
          <section className="panel">
            <h2>Ticket da completare ({aperti.length})</h2>
            {aperti.length === 0 && <p className="muted">Nessun ticket aperto.</p>}
            {aperti.map((t) => {
              const c = PRIO[t.priorita].color;
              return (
                <div className="bar-row" key={t.id}>
                  <div className="bar-label"><span>HD-{t.id} {t.titolo}</span><span style={{ color: t.slaScaduto ? c : undefined }}>{residuo(t)}</span></div>
                  <div className="bar-track"><div style={{ width: t.oreResidue < 0 ? '3%' : `${Math.max(3, (t.oreResidue / max) * 100)}%`, background: c }} /></div>
                </div>
              );
            })}
            <p className="hint">La lunghezza della barra indica il tempo rimasto fino alla scadenza (massimo {fmtOre(max)}).</p>
          </section>

          <section className="panel">
            <h2>Ticket per stato</h2>
            <div className="pie-wrap">
              <Torta fette={fette} />
              <ul className="pie-legend">
                {fette.map((f, i) => (
                  <li key={i}><i style={{ background: f.colore }} />{f.stato}{f.prio ? `, priorità ${f.prio.toLowerCase()}` : ''}<b>{f.n}</b></li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
