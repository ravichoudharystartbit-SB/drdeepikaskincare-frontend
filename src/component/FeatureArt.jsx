const common = { viewBox: "0 0 100 100", className: "feature-art", "aria-hidden": true };

export const SkinArt = () => (
  <svg {...common}>
    <rect width="100" height="100" fill="#fbe6dc" />
    <path d="M18 100c0-18 14-26 32-26s32 8 32 26z" fill="#e8a58c" />
    <ellipse cx="50" cy="48" rx="21" ry="26" fill="#f6d2bb" />
    <path d="M28 44c-2-22 12-30 24-30s24 8 22 30c-4-10-10-16-24-16s-18 6-22 16z" fill="#4a2f27" />
    <path d="M40 48q4 3 8 0M52 48q4 3 8 0M44 60q6 5 12 0" stroke="#4a2f27" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <circle cx="37" cy="56" r="4" fill="#f2a38f" opacity=".6" />
    <circle cx="63" cy="56" r="4" fill="#f2a38f" opacity=".6" />
    <path d="M78 20l2.5 6.5L87 29l-6.5 2.5L78 38l-2.5-6.5L69 29l6.5-2.5z" fill="#e8b04a" />
    <path d="M20 22l1.8 4.7L26.5 28.5l-4.7 1.8L20 35l-1.8-4.7L13.5 28.5l4.7-1.8z" fill="#e8b04a" />
  </svg>
);

export const HairArt = () => (
  <svg {...common}>
    <rect width="100" height="100" fill="#e4ecf2" />
    <path d="M50 12c-20 0-30 16-28 38 2 20-2 34-8 44h72c-6-10-10-24-8-44 2-22-8-38-28-38z" fill="#3b2a26" />
    <path d="M30 100c2-14 10-20 20-20s18 6 20 20z" fill="#d9856b" />
    <ellipse cx="50" cy="50" rx="17" ry="21" fill="#f6d2bb" />
    <path d="M33 46c4-14 12-20 17-20s13 6 17 20c-6-6-12-10-17-10s-11 4-17 10z" fill="#3b2a26" />
    <path d="M26 56c-1 10-3 18-6 26M74 56c1 10 3 18 6 26" stroke="#8a665a" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M42 50q3 2 6 0M52 50q3 2 6 0M45 60q5 4 10 0" stroke="#3b2a26" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <path d="M82 16l2.5 6.5L91 25l-6.5 2.5L82 34l-2.5-6.5L73 25l6.5-2.5z" fill="#e8b04a" />
  </svg>
);

export const LaserArt = () => (
  <svg {...common}>
    <rect width="100" height="100" fill="#ece6f5" />
    <circle cx="62" cy="88" r="42" fill="#f6d2bb" />
    <g transform="rotate(35 24 24)">
      <rect x="8" y="16" width="34" height="16" rx="5" fill="#24364b" />
      <rect x="38" y="19" width="10" height="10" rx="2" fill="#8ea3b8" />
    </g>
    <path d="M44 38L58 52" stroke="#e8514a" strokeWidth="3" strokeLinecap="round" />
    <circle cx="60" cy="54" r="9" fill="#ff8a7a" opacity=".35" />
    <circle cx="60" cy="54" r="4" fill="#e8514a" />
    <path d="M60 40v-4M72 54h4M70 44l3-3M70 64l3 3" stroke="#e8514a" strokeWidth="2" strokeLinecap="round" />
    <path d="M84 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#e8b04a" />
  </svg>
);

export const SkincareArt = () => (
  <svg {...common}>
    <rect width="100" height="100" fill="#fdf1e4" />
    <ellipse cx="50" cy="86" rx="38" ry="4" fill="#000" opacity=".07" />
    <path d="M22 52c0-14 8-22 18-24 2 12-4 22-18 24z" fill="#7fb08a" />
    <rect x="14" y="60" width="34" height="26" rx="6" fill="#fff" stroke="#dcc7b2" />
    <rect x="12" y="52" width="38" height="12" rx="4" fill="#e8b04a" />
    <rect x="56" y="42" width="26" height="44" rx="7" fill="#d98a5f" />
    <rect x="60" y="58" width="18" height="16" rx="2" fill="#fff" />
    <rect x="64" y="34" width="10" height="9" fill="#24364b" />
    <path d="M63 34v-10a6 6 0 0 1 12 0v10z" fill="#24364b" />
    <path d="M86 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#e8b04a" />
  </svg>
);

export const GenuineArt = () => (
  <svg {...common}>
    <rect width="100" height="100" fill="#e4f1ea" />
    <ellipse cx="42" cy="88" rx="34" ry="4" fill="#000" opacity=".07" />
    <rect x="22" y="44" width="30" height="42" rx="7" fill="#fff" stroke="#c9d8cf" />
    <rect x="28" y="30" width="18" height="16" rx="3" fill="#24364b" />
    <rect x="27" y="58" width="20" height="14" rx="2" fill="#d98a5f" opacity=".3" />
    <path d="M68 24l18 6v14c0 12-8 20-18 24-10-4-18-12-18-24V30z" fill="#2f9e6b" />
    <path d="M60 46l6 6 11-13" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);