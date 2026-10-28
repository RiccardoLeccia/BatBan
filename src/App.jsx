import { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import Board from './components/Board';
import TicketModal from './components/TicketModal';
import DipendenteModal from './components/DipendenteModal';
import Feedback from './components/Feedback';
import Dashboard from './pages/Dashboard';
import { api } from './utils';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [dipendenti, setDipendenti] = useState([]);
  const [cliente, setCliente] = useState('');
  const [modal, setModal] = useState(false);
  const [modalDip, setModalDip] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [conferma, setConferma] = useState(null);

  const notify = useCallback((msg, tipo = 'ok') => {
    const id = Math.random();
    setToasts((p) => [...p, { id, msg, tipo }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const load = useCallback(
    () => api('/tickets').then(setTickets).catch((e) => notify(e.message, 'err')),
    [notify]
  );
  const loadDip = useCallback(
    () => api('/dipendenti').then(setDipendenti).catch((e) => notify(e.message, 'err')),
    [notify]
  );

  useEffect(() => {
    load();
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, [load]);

  useEffect(() => { loadDip(); }, [loadDip]);

  const clienti = useMemo(() => [...new Set(tickets.map((t) => t.cliente))].sort(), [tickets]);
  const visibili = cliente ? tickets.filter((t) => t.cliente === cliente) : tickets;

  const crea = async (dati) => {
    const t = await api('/tickets', { method: 'POST', body: JSON.stringify(dati) });
    notify(`Ticket HD-${t.id} creato`);
    load();
  };

  const creaDip = async (dati) => {
    const d = await api('/dipendenti', { method: 'POST', body: JSON.stringify(dati) });
    notify(`${d.nome} aggiunto ai dipendenti`);
    loadDip();
  };

  const sposta = async (id, stato) => {
    setTickets((p) => p.map((t) => (t.id === id ? { ...t, stato } : t)));
    try {
      await api(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify({ stato }) });
    } catch (e) {
      notify(e.message, 'err');
    }
    load();
  };

  const elimina = async () => {
    const t = conferma;
    setConferma(null);
    try {
      await api(`/tickets/${t.id}`, { method: 'DELETE' });
      notify(`Ticket HD-${t.id} eliminato`);
    } catch (e) {
      notify(e.message, 'err');
    }
    load();
  };

  return (
    <BrowserRouter>
      <div className="shell">
        <Header />
        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/board" replace />} />
            <Route
              path="/board"
              element={
                <>
                  <Toolbar clienti={clienti} cliente={cliente} onChange={setCliente} totale={visibili.length} onNew={() => setModal(true)} />
                  <Board tickets={visibili} onMove={sposta} onDelete={setConferma} />
                </>
              }
            />
            <Route path="/dipendenti" element={<Dashboard tickets={tickets} dipendenti={dipendenti} onNew={() => setModalDip(true)} />} />
            <Route path="*" element={<Navigate to="/board" replace />} />
          </Routes>
        </main>
      </div>
      {modal && <TicketModal clienti={clienti} dipendenti={dipendenti} tickets={tickets} onClose={() => setModal(false)} onSubmit={crea} />}
      {modalDip && <DipendenteModal dipendenti={dipendenti} onClose={() => setModalDip(false)} onSubmit={creaDip} />}
      <Feedback toasts={toasts} conferma={conferma} onCancel={() => setConferma(null)} onConfirm={elimina} />
    </BrowserRouter>
  );
}