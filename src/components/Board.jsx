import { useState } from 'react';
import TicketCard from './TicketCard';
import { STATI } from '../utils';

export default function Board({ tickets, onMove, onDelete }) {
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);

  return (
    <div className="board">
      {STATI.map((s) => {
        const lista = tickets
          .filter((t) => t.stato === s.id)
          .sort((a, b) => new Date(a.scadenza) - new Date(b.scadenza));
        return (
          <section
            key={s.id}
            data-stato={s.id}
            className={`column ${over === s.id ? 'over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOver(s.id); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); }}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              if (drag && drag.stato !== s.id) onMove(drag.id, s.id);
              setDrag(null);
            }}
          >
            <h2 className="column-title">{s.label}<span>{lista.length}</span></h2>
            <div className="column-body">
              {lista.length === 0 && <p className="empty">Nessun ticket</p>}
              {lista.map((t) => (
                <TicketCard key={t.id} ticket={t} dragging={drag?.id === t.id}
                  onDragStart={() => setDrag(t)} onDragEnd={() => { setDrag(null); setOver(null); }}
                  onMove={onMove} onDelete={onDelete} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
