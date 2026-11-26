// Loads and changes the signed-in artist's campaigns.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient"; // relative: no Vite alias covers top-level src/ files
import { rowToCampaign } from "./rowToCampaign";

export function useCampaigns(userId) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "removed")
      .order("created_at", { ascending: false });

    if (fetchError) setError(fetchError.message);
    else setCampaigns((data ?? []).map(rowToCampaign));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Returns { campaign } or { error } so the flow can show the result itself.
  async function createCampaign(draft) {
    if (!userId) return { error: "Please sign in again." };
    const { data, error: insertError } = await supabase
      .from("campaigns")
      .insert({
        user_id: userId,
        name: draft.name,
        platform: draft.platform,
        budget: draft.budget,
        package: draft.package,
        release_date: draft.package === "presave" ? draft.releaseDate : null,
        reserve_release_spots: draft.package === "presave" && draft.reserve,
        goal: draft.goal,
        status: "pending",
        ...(draft.track && { spotify_track: draft.track }),
      })
      .select()
      .single();

    if (insertError) return { error: insertError.message };
    const campaign = rowToCampaign(data);
    setCampaigns((prev) => [campaign, ...prev]);
    return { campaign };
  }

  async function togglePause(campaign) {
    const status = campaign.status === "paused" ? "active" : "paused";
    setError(null);
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({ status })
      .eq("id", campaign.id)
      .eq("user_id", userId);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, status } : c)));
  }

  return { campaigns, loading, error, createCampaign, togglePause };
}
