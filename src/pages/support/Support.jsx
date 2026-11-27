import { useCallback, useEffect, useState } from "react";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import SEOHead from "components/SEOHead";
import Breadcrumbs from "components/Breadcrumbs";
import AccountSidebar from "components/AccountSidebar";
import { supabase } from "../../supabaseClient";
import { useSupabaseAuth } from "context/SupabaseAuthContext";
import TicketForm from "./components/TicketForm";
import TicketList from "./components/TicketList";
import { SUPPORT_EMAIL } from "./constants";
import "../Auth/Profile.css";
import "./Support.css";

// Postgres / PostgREST codes for "this table does not exist yet".
const MISSING_TABLE = ["42P01", "PGRST205"];

export default function Support() {
  const { user } = useSupabaseAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadTickets = useCallback(async () => {
    if (!user?.id) return;
    // Filtered by user as well as by RLS: staff can read every row.
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, category, subject, message, status, staff_reply, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setTickets(data ?? []);
    setLoadError(error);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTickets();
  }, [loadTickets]);

  const unavailable = loadError && MISSING_TABLE.includes(loadError.code);

  return (
    <div className="profile-page">
      <SEOHead title="Support" description="Contact Artist RADR and track your support tickets." path="/support" />
      <Navbar routes={routes} />

      <div className="profile-crumbs">
        <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Support", path: "/support" }]} />
      </div>

      <div className="profile-shell">
        <div className="profile-main">
          <div className="profile-kicker">Help</div>
          <h1 className="profile-title">Support</h1>

          {unavailable ? (
            <div className="profile-alert" role="alert">
              Tickets aren&apos;t available yet. Email us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </div>
          ) : (
            <>
              <TicketForm userId={user?.id} onCreated={loadTickets} />
              <TicketList tickets={tickets} loading={loading} failed={Boolean(loadError)} />
            </>
          )}

          <p className="support-email">
            You can also email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </div>

        <AccountSidebar activeKey="support" />
      </div>

      <Footer />
    </div>
  );
}
