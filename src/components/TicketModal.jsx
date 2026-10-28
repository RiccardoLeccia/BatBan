import { useState } from 'react';
import { CATEGORIE, norm } from '../utils';

// Valore di default per datetime-local: domani alla stessa ora (ora locale del browser)
const locale = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function TicketModal({ clienti, dipendenti, tickets, onClose, onSubmit }) {
  const [f, setF] = useState({
    titolo: '',
    cliente: '',
    categoria: 'SOFTWARE_BUG',
    tecnicoNome: dipendenti[0]?.nome ?? '',
    descrizione: '',
    scadenza: locale(new Date(Date.now() + 86400000))
  });

  const [errore, setErrore] = useState('');
  const [invio, setInvio] = useState(false);

  // Stati per la gestione del popup custom dei suggerimenti
  const [focusCliente, setFocusCliente] = useState(false);
  const [focusTecnico, setFocusTecnico] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Filtra i suggerimenti in tempo reale
  const clientiFiltrati = clienti.filter((c) => norm(c).includes(norm(f.cliente)));
  const dipendentiFiltrati = dipendenti.filter(
    (d) => norm(d.nome).includes(norm(f.tecnicoNome)) || norm(d.specializzazione).includes(norm(f.tecnicoNome))
  );

  const submit = async (e) => {
    e.preventDefault();

    // 1. Controllo se il tecnico scritto esiste tra i dipendenti
    const tecnicoTrovato = dipendenti.find((d) => norm(d.nome) === norm(f.tecnicoNome));
    if (!tecnicoTrovato) {
      return setErrore('Seleziona un tecnico valido presente nella lista.');
    }

    // 2. Controllo duplicati
    const doppio = tickets.find((t) => t.stato !== 'RESOLVED' && norm(t.cliente) === norm(f.cliente) && norm(t.titolo) === norm(f.titolo));
    if (doppio) return setErrore(`Esiste già il ticket HD-${doppio.id} aperto con lo stesso titolo per questo cliente.`);

    setInvio(true);
    setErrore('');

    try {
      await onSubmit({
        titolo: f.titolo,
        cliente: f.cliente,
        categoria: f.categoria,
        assegnatarioId: Number(tecnicoTrovato.id),
        descrizione: f.descrizione,
        scadenza: new Date(f.scadenza).toISOString()
      });
      onClose();
    } catch (err) {
      setErrore(err.message);
      setInvio(false);
    }
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <form className="dialog" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Nuovo ticket</h2>
        <div className="grid">
          <label className="full">
            Titolo
            <input value={f.titolo} onChange={set('titolo')} required autoFocus />
          </label>

          {/* AUTOCOMPLETAMENTO CLIENTE CON STILE SELECT */}
          <label style={{ position: 'relative' }}>
            Cliente
            <input
              value={f.cliente}
              onChange={set('cliente')}
              onFocus={() => setFocusCliente(true)}
              onBlur={() => setTimeout(() => setFocusCliente(false), 150)}
              placeholder="Cerca o inserisci cliente..."
              required
              autoComplete="off"
            />
            {focusCliente && clientiFiltrati.length > 0 && (
              <div className="custom-dropdown">
                {clientiFiltrati.map((c) => (
                  <div
                    key={c}
                    className="dropdown-item"
                    onMouseDown={() => {
                      setF((prev) => ({ ...prev, cliente: c }));
                      setFocusCliente(false);
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </label>

          {/* AUTOCOMPLETAMENTO TECNICO CON CONTROLLO E STILE SELECT */}
          <label style={{ position: 'relative' }}>
            Assegnato a
            <input
              value={f.tecnicoNome}
              onChange={set('tecnicoNome')}
              onFocus={() => setFocusTecnico(true)}
              onBlur={() => setTimeout(() => setFocusTecnico(false), 150)}
              placeholder="Cerca tecnico..."
              required
              autoComplete="off"
            />
            {focusTecnico && dipendentiFiltrati.length > 0 && (
              <div className="custom-dropdown">
                {dipendentiFiltrati.map((d) => (
                  <div
                    key={d.id}
                    className="dropdown-item"
                    onMouseDown={() => {
                      setF((prev) => ({ ...prev, tecnicoNome: d.nome }));
                      setFocusTecnico(false);
                    }}
                  >
                    <b>{d.nome}</b> <small className="muted">· {d.specializzazione}</small>
                  </div>
                ))}
              </div>
            )}
          </label>

          <label>
            Categoria
            <select value={f.categoria} onChange={set('categoria')}>
              {Object.entries(CATEGORIE).map(([k, v]) => (
                <option key={k} value={k}>{typeof v === 'object' ? v.label : v}</option>
              ))}
            </select>
          </label>

          <label>
            Scadenza
            <input type="datetime-local" value={f.scadenza} min={locale(new Date())} onChange={set('scadenza')} required />
          </label>

          <label className="full">
            Descrizione
            <textarea rows={3} value={f.descrizione} onChange={set('descrizione')} required />
          </label>
        </div>

        <p className="hint">La priorità viene calcolata dal server in base alle ore che mancano alla scadenza.</p>
        {errore && <p className="form-error" role="alert">{errore}</p>}

        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>Annulla</button>
          <button type="submit" className="btn btn-primary" disabled={invio}>Crea ticket</button>
        </div>
      </form>
    </div>
  );
}