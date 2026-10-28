import { useState } from 'react';
import { norm } from '../utils';

export default function DipendenteModal({ dipendenti, onClose, onSubmit }) {
  const [f, setF] = useState({ nome: '', specializzazione: '' });
  const [errore, setErrore] = useState('');
  const [invio, setInvio] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const omonimi = f.nome.trim() ? dipendenti.filter((d) => norm(d.nome) === norm(f.nome)) : [];

  const submit = async (e) => {
    e.preventDefault();
    const nome = f.nome.trim().replace(/\s+/g, ' ');
    const spec = f.specializzazione.trim().replace(/\s+/g, ' ');
    if (nome.length < 3 || spec.length < 2) return setErrore('Inserisci nome e cognome e la specializzazione.');
    if (dipendenti.some((d) => norm(d.nome) === norm(nome) && norm(d.specializzazione) === norm(spec))) {
      return setErrore(`${nome} (${spec}) è già presente.`);
    }
    setInvio(true);
    setErrore('');
    try {
      await onSubmit({ nome, specializzazione: spec });
      onClose();
    } catch (err) {
      setErrore(err.message);
      setInvio(false);
    }
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <form className="dialog small" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Nuovo dipendente</h2>
        <div className="grid">
          <label className="full">Nome e cognome<input value={f.nome} onChange={set('nome')} required autoFocus /></label>
          <label className="full">Specializzazione<input value={f.specializzazione} onChange={set('specializzazione')} required /></label>
        </div>
        {omonimi.length > 0 && (
          <p className="hint">Esiste già {omonimi.length === 1 ? 'un dipendente' : 'più dipendenti'} con questo nome ({omonimi.map((o) => o.specializzazione).join(', ')}). Puoi inserire un omonimo solo con una specializzazione diversa.</p>
        )}
        <p className="hint">L'identificativo viene assegnato in automatico.</p>
        {errore && <p className="form-error" role="alert">{errore}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>Annulla</button>
          <button type="submit" className="btn btn-primary" disabled={invio}>Aggiungi</button>
        </div>
      </form>
    </div>
  );
}
