// src/studio/StudioInstagramCallback.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { consumeState, exchangeInstagramCode } from "./instagram";

// A login code can only be used once. React StrictMode runs effects twice in
// development, so remember which code we've already handled.
let handledCode = null;

export default function StudioInstagramCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("working"); // working | ok | error
  const [message, setMessage] = useState("Finishing the Instagram connection…");

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const fbError = params.get("error");

    if (fbError) {
      setStatus("error");
      setMessage(
        fbError === "access_denied"
          ? "Access was declined. Nothing was connected."
          : `Facebook returned an error: ${params.get("error_description") || fbError}`
      );
      return;
    }
    if (!code) {
      setStatus("error");
      setMessage("No login code was returned by Facebook.");
      return;
    }
    if (handledCode === code) return;
    handledCode = code;

    if (!consumeState(state)) {
      setStatus("error");
      setMessage("The sign-in check failed (state mismatch). Please start the connection again.");
      return;
    }

    exchangeInstagramCode(code)
      .then((result) => {
        setStatus("ok");
        setMessage(`Connected as ${result.display_name}. Taking you to Discovery…`);
        setTimeout(() => navigate("/studio/discovery", { replace: true }), 1200);
      })
      .catch((err) => {
        setStatus("error");
        const pages = err.payload?.pages;
        setMessage(
          pages?.length
            ? `More than one Page was shared (${pages.map((p) => p.name).join(", ")}). Start the connection again and share only the Artistradr Page.`
            : err.message || "Could not finish connecting Instagram."
        );
      });
  }, [params, navigate]);

  return (
    <>
      <h1 className="rs-h1">Instagram</h1>
      <p className="rs-sub">{message}</p>
      {status === "error" && (
        <Link to="/studio/discovery" className="rs-chip next" style={{ textDecoration: "none" }}>
          ← Back to Discovery
        </Link>
      )}
    </>
  );
}
