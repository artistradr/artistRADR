export const LOCK_CSS = `
  @keyframes lockFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .lock-overlay { position:fixed;inset:0;z-index:100;display:flex;align-items:flex-start;justify-content:center;padding:90px 1.5rem 1.5rem;overflow-y:auto; }
  .lock-blur-bg { position:fixed;inset:0;background:rgba(247,246,243,0.75);backdrop-filter:blur(14px); }
  .lock-card { position:relative;background:white;border-radius:24px;padding:40px 36px;max-width:440px;width:100%;text-align:center;border:0.5px solid rgba(0,0,0,0.08);box-shadow:0 24px 60px rgba(0,0,0,0.13);animation:lockFadeUp 380ms cubic-bezier(.175,.885,.32,1.1) both;flex-shrink:0; }
  .lock-btn { width:100%;padding:14px;border-radius:12px;border:none;font-family:var(--font-body);font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms,transform 100ms;letter-spacing:0.3px; }
  .lock-btn:hover{opacity:0.87;transform:translateY(-1px)}
`;

export const PAGE_CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes unlockPulse { 0%,100%{box-shadow:0 0 0 0 rgba(217,79,43,0)} 50%{box-shadow:0 0 0 8px rgba(217,79,43,0.12)} }
  .ps-page { animation:fadeUp 400ms ease both; font-family:var(--font-body); background:#f7f6f3; min-height:100vh; display:flex; flex-direction:column; }
  .ps-body { max-width:1180px; margin:0 auto; padding:0 1.5rem 100px; display:grid; grid-template-columns:1fr 400px; gap:60px; align-items:start; }
  @media(max-width:900px){ .ps-body{ grid-template-columns:1fr; gap:40px; } }
  .ps-right { position:sticky; top:100px; }
  .ps-step { border-radius:16px; border:0.5px solid rgba(0,0,0,0.08); background:white; margin-bottom:12px; overflow:hidden; transition:border-color 200ms,box-shadow 200ms; }
  .ps-step.active { border-color:rgba(0,0,0,0.15); box-shadow:0 6px 30px rgba(0,0,0,0.08); }
  .ps-step.done { border-color:rgba(34,197,94,0.3); background:#fafffe; }
  .ps-step.locked { opacity:0.4; pointer-events:none; }
  .ps-step-header { display:flex; align-items:center; gap:16px; padding:20px 24px; }
  .ps-step-num { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-size:13px; font-weight:800; flex-shrink:0; transition:background 300ms; }
  .ps-step-body { padding:0 24px 24px; animation:fadeUp 250ms ease both; }
  .ps-follow-item { display:flex; align-items:center; gap:12px; padding:13px 16px; border-radius:11px; background:#f7f6f3; border:0.5px solid rgba(0,0,0,0.06); margin-bottom:8px; transition:background 200ms,border-color 200ms; }
  .ps-follow-item.done { background:#f0fdf4; border-color:rgba(34,197,94,0.25); }
  .ps-btn { width:100%; padding:14px; border-radius:12px; border:none; font-family:var(--font-body); font-size:13px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:opacity 150ms,transform 100ms; letter-spacing:0.4px; }
  .ps-btn:hover:not(:disabled){ opacity:0.87; transform:translateY(-1px); }
  .ps-btn:disabled{ opacity:0.5; cursor:not-allowed; }
  .ps-spinner { width:15px; height:15px; border-radius:50%; border:2px solid rgba(255,255,255,0.3); border-top-color:white; animation:spin 700ms linear infinite; flex-shrink:0; }
  .ps-prog-track { height:3px; border-radius:100px; background:rgba(0,0,0,0.07); overflow:hidden; }
  .ps-prog-fill { height:100%; border-radius:100px; background:linear-gradient(90deg,#D94F2B,#4DD9D0); transition:width 700ms cubic-bezier(.4,0,.2,1); }
  .ps-honor { width:22px; height:22px; border-radius:7px; border:1.5px solid rgba(0,0,0,0.18); background:white; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:all 150ms; }
  .ps-honor.on { background:#E1306C; border-color:#E1306C; }
  .ps-opt-chk { width:18px; height:18px; border-radius:5px; border:1.5px solid rgba(0,0,0,0.16); background:white; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:all 150ms; }
  .ps-opt-chk.on { background:#111; border-color:#111; }
  .ps-unlock { background:white; border:0.5px solid rgba(0,0,0,0.08); border-radius:20px; padding:40px 36px; animation:fadeUp 400ms ease both; }
  .ps-unlock-icon { width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,#D94F2B,#e8633c); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; animation:unlockPulse 2s ease infinite; }
  .ps-panel { background:white; border:0.5px solid rgba(0,0,0,0.08); border-radius:20px; padding:32px; }
  .ps-panel-step { display:flex; align-items:flex-start; gap:14px; padding:14px 0; border-bottom:0.5px solid rgba(0,0,0,0.06); }
  .ps-panel-step:last-child { border-bottom:none; padding-bottom:0; }
  .ps-panel-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:6px; }
  .ps-yt-hint { font-size:12px; color:#888; background:#fff8f0; border:0.5px solid rgba(255,150,0,0.2); border-radius:10px; padding:10px 14px; margin-bottom:12px; line-height:1.6; }
`;
