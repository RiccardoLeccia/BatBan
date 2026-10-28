const ALA = 'M25 15 L18 8 Q10 4 1 7 Q5 11 5 16 Q9 13 11 18 Q14 14 17 20 Q19 17 25 21 Z';

export default function Logo() {
  return (
    <svg className="logo" viewBox="0 0 64 36" role="img" aria-label="Batban">
      <defs>
        <linearGradient id="bbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#85b8ff" />
          <stop offset="1" stopColor="#1d7afc" />
        </linearGradient>
      </defs>
      <g transform="translate(0 4)" fill="url(#bbg)">
        <path d={ALA} />
        <path d={ALA} transform="translate(64 0) scale(-1 1)" />
      </g>
      <text x="32" y="26" textAnchor="middle" fontSize="19" fontWeight="800" fill="#fff" fontFamily="Inter,system-ui,sans-serif" letterSpacing="-1">BB</text>
    </svg>
  );
}
