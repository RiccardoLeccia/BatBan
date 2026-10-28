import { useState } from "react";

export default function LoginModal({ onLogin }) {
  const [username, setUsername] = useState("user_enterprise_b2b");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    let scope = "helpdesk.read";
    if (role === "write") scope = "helpdesk.read helpdesk.write";
    if (role === "admin") scope = "helpdesk.read helpdesk.write helpdesk.admin";

    try {
      // Costruzione parametri standard OAuth 2.0 (Password Credentials Grant)
      const bodyParams = new URLSearchParams();
      bodyParams.append("grant_type", "password");
      bodyParams.append("username", username);
      bodyParams.append("password", password);
      bodyParams.append("scope", scope);

      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: bodyParams.toString()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error_description || data.error || data.message || "Errore nella richiesta del token OAuth2.");
      }

      if (data.access_token) {
        onLogin(data.access_token);
      } else {
        throw new Error("Risposta OAuth2 priva di access_token.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Errore di connessione all'Identity Provider.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      backgroundColor: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
    }}>
      <div style={{
        backgroundColor: "#ffffff", padding: "2.5rem", borderRadius: "12px", width: "100%", maxWidth: "420px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)"
      }}>
        <h2 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#0f172a", fontSize: "1.5rem" }}>Autenticazione OAuth 2.0</h2>
        <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem" }}>
          Password Credentials Grant: richiedi un Bearer Token JWT selezionando i permessi (GRANT).
        </p>

        {errorMsg && (
          <div style={{
            backgroundColor: "#fee2e2", color: "#991b1b", padding: "0.75rem", borderRadius: "6px",
            marginBottom: "1rem", fontSize: "0.85rem"
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
              Username / Client ID
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
              Password / Client Secret
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
              Permessi Richiesti (GRANT / Scope)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", backgroundColor: "#fff" }}
            >
              <option value="read">Lettura (helpdesk.read)</option>
              <option value="write">Lettura + Scrittura (helpdesk.read helpdesk.write)</option>
              <option value="admin">Amministratore Completo (read + write + admin)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "0.75rem", backgroundColor: "#2563eb", color: "#ffffff",
              border: "none", borderRadius: "6px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Richiesta token in corso..." : "Accedi e Richiedi Token (OAuth2)"}
          </button>
        </form>
      </div>
    </div>
  );
}
