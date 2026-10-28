export default function Feedback({ toasts, conferma, onCancel, onConfirm }) {
  return (
    <>
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast ${t.tipo}`}>{t.msg}</div>)}
      </div>
      {conferma && (
        <div className="backdrop" onMouseDown={onCancel}>
          <div className="dialog small" role="alertdialog" onMouseDown={(e) => e.stopPropagation()}>
            <h2>Eliminare il ticket HD-{conferma.id}?</h2>
            <p className="muted">{conferma.titolo}. L'operazione non si può annullare.</p>
            <div className="dialog-actions">
              <button type="button" className="btn" onClick={onCancel}>Annulla</button>
              <button type="button" className="btn btn-danger" onClick={onConfirm} autoFocus>Elimina</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
