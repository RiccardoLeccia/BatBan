const PAL = ['#1d7afc', '#6e5dc6', '#b38600', '#1f845a', '#c9372c', '#2898bd', '#e56910'];

export default function Avatar({ nome, size = 24 }) {
  const ini = nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const c = PAL[[...nome].reduce((a, ch) => a + ch.charCodeAt(0), 0) % PAL.length];
  return <span className="avatar" title={nome} style={{ background: c, width: size, height: size, minWidth: size, minHeight: size, fontSize: size * 0.4 }}>{ini}</span>;
}
