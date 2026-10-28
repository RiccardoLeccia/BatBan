import { NavLink } from 'react-router-dom';
import Logo from './Logo';

export default function Header({ onNavigate, onLogout }) {
  return (
    <aside className="sidebar" aria-label="Menu principale">
      <div className="brand">
        <div className="brand-logo">
          <Logo />
        </div>
        <div className="brand-text">
          <b>Batban</b>
          <small>Gestionale progetti</small>
        </div>
      </div>

      <nav className="nav">
        <span className="nav-title">Area di lavoro</span>
        
        <NavLink to="/board" onClick={onNavigate} className="nav-item">
          <span className="nav-icon">📋</span>
          <span className="nav-text">Board</span>
        </NavLink>

        <NavLink to="/dipendenti" onClick={onNavigate} className="nav-item">
          <span className="nav-icon">👥</span>
          <span className="nav-text">Dipendenti</span>
        </NavLink>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="nav-item"
            style={{
              background: 'none',
              border: 'none',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              marginTop: '1.5rem',
              color: '#ef4444'
            }}
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Logout</span>
          </button>
        )}
      </nav>
    </aside>
  );
}
