export const GLOBAL_CSS = (T) => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; }
  body { margin:0; -webkit-font-smoothing:antialiased; line-height:1.5; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:${T.scrollThumb}; border-radius:2px; }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes revolve { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes enter   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  @keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes wSlideUp { from{opacity:0;transform:translateY(20px);filter:blur(6px)} to{opacity:1;transform:translateY(0);filter:blur(0)} }
  @keyframes wFadeIn  { from{opacity:0;filter:blur(8px)} to{opacity:1;filter:blur(0)} }
  @keyframes wZoom    { 0%{transform:scale(1)} 100%{transform:scale(1.06)} }
  .page { animation:enter 0.2s ease; }
  button, input { font-family:inherit; }

  /* ── Desktop nav ── */
  .desk-nav { overflow-x:auto; scrollbar-width:none; }
  .desk-nav::-webkit-scrollbar { display:none; }

  /* ── Grid helpers ── */
  .g-auto    { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; }
  .g-charts  { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; }

  /* ── Mobile overrides ── */
  @media(max-width:720px) {
    .desk-nav      { display:none !important; }
    .mob-btn       { display:flex !important; }
    .mob-bottom-bar{ display:flex !important; }
    .mob-export    { display:none !important; }
    .mob-time      { display:none !important; }
    footer         { display:none !important; }

    /* grid overrides */
    .g-auto   { grid-template-columns:repeat(2,1fr) !important; gap:8px !important; }
    .g-charts { grid-template-columns:1fr !important; gap:10px !important; }
    .g-map    { grid-template-columns:1fr !important; gap:10px !important; height:auto !important; min-height:0 !important; }

    /* AI page — FIX: all columns stack, metrics 3-col */
    .ai-main    { grid-template-columns:1fr !important; gap:12px !important; }
    .ai-verdict { grid-template-columns:1fr !important; }
    .ai-metrics { grid-template-columns:repeat(3,1fr) !important; gap:6px !important; }
    .ai-details { grid-template-columns:1fr !important; gap:10px !important; }

    /* page padding — extra bottom so bottom bar doesn't cover content */
    .page { padding:12px 12px 80px !important; overflow-x:hidden !important; }

    /* panels & stats */
    .mob-panel { padding:12px !important; border-radius:14px !important; }
    .mob-title { font-size:12px !important; margin-bottom:8px !important; }
    .mob-stat  { padding:10px 12px !important; border-radius:12px !important; }
    .mob-stat-val   { font-size:20px !important; }
    .mob-stat-title { font-size:9px !important; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .mob-stat-note  { font-size:9px !important; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    /* header */
    .mob-header       { height:48px !important; }
    .mob-header-inner { padding:0 10px !important; }
    .mob-logo-text    { font-size:14px !important; }
    .mob-logo-sub     { font-size:7px !important; }

    /* chat */
    .chat-wrap { height:calc(100dvh - 140px) !important; }

    /* map page — fixed height so it doesn't overflow viewport */
    .map-page-wrap { height:calc(100dvh - 130px) !important; grid-template-columns:1fr !important; }
    .map-sidebar   { display:none !important; }

    /* table scroll */
    table { display:block !important; overflow-x:auto !important; font-size:11px !important; }
    table th, table td { padding:6px 6px !important; white-space:nowrap !important; }

    /* recharts font */
    .recharts-wrapper { font-size:10px !important; }

    /* minimap hide on mobile */
    #dala-minimap { display:none !important; }
  }

  @media(max-width:400px) {
    .g-auto    { grid-template-columns:repeat(2,1fr) !important; gap:6px !important; }
    .ai-metrics{ grid-template-columns:repeat(2,1fr) !important; }
    .mob-stat  { padding:8px 10px !important; }
    .mob-stat-val { font-size:16px !important; }
    .page { padding:8px 8px 80px !important; }
  }

  @media(min-width:721px) {
    .mob-btn        { display:none !important; }
    .mob-menu       { display:none !important; }
    .mob-bottom-bar { display:none !important; }
  }

  @media(min-width:721px) and (max-width:1200px) {
    .desk-nav button .nav-lbl { display:none !important; }
  }
`;
