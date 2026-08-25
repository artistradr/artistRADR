// src/pages/Auth/SpotifyCallback.jsx
// Route: /auth/spotify/callback
//
// Receives the authorization code (or error) from Spotify after the user
// approves/denies, posts it back to the opener window, then closes itself.

export default function SpotifyCallback() {
  const params = new URLSearchParams(window.location.search);
  const code   = params.get("code");
  const error  = params.get("error");

  if (window.opener) {
    if (code) {
      window.opener.postMessage(
        { type: "spotify_oauth_code", code },
        window.location.origin
      );
    } else if (error) {
      // User denied consent or Spotify returned an error — relay it so the
      // opener isn't left waiting forever for a message that never comes.
      window.opener.postMessage(
        { type: "spotify_oauth_error", error },
        window.location.origin
      );
    }
  }

  // Small delay so postMessage has time to deliver before the window closes.
  // Only auto-close popups this page actually opened — window.close() is a
  // silent no-op on a tab opened by the user directly (no window.opener),
  // so guard it to avoid stranding someone on a permanent "Closing…" screen.
  if (window.opener) {
    setTimeout(() => window.close(), 500);
  }

  return (
    <div style={{ fontFamily:"var(--font-body)", display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f7f6f3", flexDirection:"column", gap:"12px" }}>
      <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:error?"#fef2f2":"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {error
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        }
      </div>
      <p style={{ fontSize:"13px", color:"#888", fontWeight:300 }}>
        {error
          ? "Authentication failed. Closing…"
          : window.opener
            ? "Spotify connected! Finishing up…"
            : "Spotify connected! You can close this window."}
      </p>
    </div>
  );
}