// Which campaigns have a paid payment. Staff can read every payment.
// `paid` is null when payments couldn't be read: callers then neither label nor block.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export function usePaidCampaigns() {
  const [paid, setPaid] = useState(null);

  const reloadPaid = useCallback(async () => {
    const { data, error } = await supabase.from("payments").select("campaign_id").eq("status", "paid");
    setPaid(error ? null : new Set((data ?? []).map((p) => p.campaign_id)));
  }, []);

  useEffect(() => {
    reloadPaid();
  }, [reloadPaid]);

  return { paid, reloadPaid };
}
