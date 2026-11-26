// Loads and changes the signed-in artist's campaigns.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient"; // relative: no Vite alias covers top-level src/ files
import { rowToCampaign } from "./rowToCampaign";
import { removeCampaign } from "./payments";

export function useCampaigns(userId) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const [{ data, error: fetchError }, paidResult] = await Promise.all([
      supabase
        .from("campaigns")
        .select("*, campaign_playlists(id, spotify_playlist_id, title, image_url, created_at)")
        .eq("user_id", userId)
        .neq("status", "removed")
        .order("created_at", { ascending: false }),
      supabase.from("payments").select("campaign_id").eq("user_id", userId).eq("status", "paid"),
    ]);

    if (fetchError) setError(fetchError.message);
    else {
      // If payments can't be read, `paid` stays undefined: no Unpaid label and no Delete,
      // because we can't be sure. Pay now still shows; the server refuses a second payment.
      const paid = paidResult.error ? null : new Set((paidResult.data ?? []).map((p) => p.campaign_id));
      setCampaigns(
        (data ?? []).map((row) => ({ ...rowToCampaign(row), paid: paid ? paid.has(row.id) : undefined })),
      );
    }
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
    // A brand-new campaign has no payment yet.
    const campaign = { ...rowToCampaign(data), paid: false };
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

  // Throws with a readable message if the server refuses (for example, it was paid meanwhile).
  async function deleteCampaign(campaignId) {
    await removeCampaign(campaignId);
    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
  }

  return { campaigns, loading, error, createCampaign, togglePause, deleteCampaign };
}
