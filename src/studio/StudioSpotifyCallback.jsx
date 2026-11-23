// src/studio/StudioSpotifyCallback.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { consumeState, exchangeCode } from "./spotify";

// A login code can only be used once. React StrictMode runs effects twice in
// development, so remember which code we've already handled.
let handledCode = null;

export default function StudioSpotifyCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("working"); // working | ok | error
  const [message, setMessage] = useState("Finishing the Spotify connection…");

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const spotifyError = params.get("error");

    if (spotifyError) {
      setStatus("error");
      setMessage(
        spotifyError === "access_denied"
          ? "Spotify access was declined. Nothing was connected."
          : `Spotify returned an error: ${spotifyError}`
      );
      return;
    }
    if (!code) {
      setStatus("error");
      setMessage("No login code was returned by Spotify.");
      return;
    }
    if (handledCode === code) return;
    handledCode = code;

    if (!consumeState(state)) {
      setStatus("error");
      setMessage("The sign-in check failed (state mismatch). Please start the connection again.");
      return;
    }

    exchangeCode(code)
      .then((result) => {
        setStatus("ok");
        setMessage(`Connected as ${result.display_name}. Taking you to Playlists…`);
        setTimeout(() => navigate("/studio/playlists", { replace: true }), 1200);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Could not finish connecting Spotify.");
      });
  }, [params, navigate]);

  return (
    <>
      <h1 className="rs-h1">Spotify</h1>
      <p className="rs-sub">{message}</p>
      {status === "error" && (
        <Link to="/studio/playlists" className="rs-chip next" style={{ textDecoration: "none" }}>
          ← Back to Playlists
        </Link>
      )}
    </>
  );
}