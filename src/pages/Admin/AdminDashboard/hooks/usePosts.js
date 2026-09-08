import { useState, useEffect } from "react";
import { supabase } from "../../../../supabaseClient";
import { isActivelyFeatured } from "../utils";

export default function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postFilter, setPostFilter] = useState("all");
  const [deleting, setDeleting] = useState(null);
  const [pinningId, setPinningId] = useState(null);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    // profiles:author_id pulls the publishing staffer's full_name for
    // native Supabase posts. Legacy WP-migrated posts have author_id = null
    // and no matching profile — PostRow falls back to the author_name text
    // column for those. Relies on the "staff read all profiles" RLS policy.
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles:author_id (full_name)")
      .order("published_at", { ascending: false });
    if (error) console.error(error);
    else setPosts(data);
    setLoadingPosts(false);
  };

  const togglePublish = async (post) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("posts").update({ status: newStatus }).eq("id", post.id);
    if (error) { console.error(error); return; }
    setPosts((p) => p.map((x) => (x.id === post.id ? { ...x, status: newStatus } : x)));
  };

  // Business rule: published posts can't be deleted — they must be
  // unpublished first. The Delete button is already disabled for published
  // posts in PostActions, but this guard covers any other caller (and
  // protects against a stale `posts` list letting a disabled button through).
  const deletePost = async (post) => {
    if (post.status === "published") {
      window.alert("This post is published. Unpublish it before deleting.");
      return;
    }
    if (!window.confirm("Delete this post permanently?")) return;
    setDeleting(post.id);
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) console.error(error);
    else setPosts((p) => p.filter((x) => x.id !== post.id));
    setDeleting(null);
  };

  // Pins `postId` to `slot` (1/2/3) for `days` days from now.
  // The DB has a partial unique index on featured_slot (where not null), so
  // whoever currently holds that slot must be cleared first, in a separate
  // update. These two writes are not atomic — if two admins pin to the same
  // slot within the same round trip, the second write wins and the first
  // is silently bumped. Acceptable for a single-admin dashboard; worth a
  // proper RPC/transaction if this ever gets more than one concurrent editor.
  const pinFeatured = async (postId, slot, days) => {
    setPinningId(postId);
    const currentOccupant = posts.find((p) => p.id !== postId && p.featured_slot === slot);
    if (currentOccupant) {
      const { error: clearError } = await supabase
        .from("posts")
        .update({ featured_slot: null, featured_until: null, featured_pinned_at: null })
        .eq("id", currentOccupant.id);
      if (clearError) {
        console.error(clearError);
        window.alert("Couldn't clear the existing slot occupant — check console.");
        setPinningId(null);
        return;
      }
    }

    const now = new Date();
    const featuredUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("posts")
      .update({ featured_slot: slot, featured_until: featuredUntil, featured_pinned_at: now.toISOString() })
      .eq("id", postId);
    if (error) {
      console.error(error);
      window.alert("Couldn't pin this post — check console for details.");
      setPinningId(null);
      return;
    }

    setPosts((p) =>
      p.map((x) => {
        if (x.id === postId) return { ...x, featured_slot: slot, featured_until: featuredUntil, featured_pinned_at: now.toISOString() };
        if (currentOccupant && x.id === currentOccupant.id) return { ...x, featured_slot: null, featured_until: null, featured_pinned_at: null };
        return x;
      })
    );
    setPinningId(null);
  };

  const unpinFeatured = async (postId) => {
    setPinningId(postId);
    const { error } = await supabase
      .from("posts")
      .update({ featured_slot: null, featured_until: null, featured_pinned_at: null })
      .eq("id", postId);
    if (error) {
      console.error(error);
      window.alert("Couldn't unpin this post — check console for details.");
      setPinningId(null);
      return;
    }
    setPosts((p) => p.map((x) => (x.id === postId ? { ...x, featured_slot: null, featured_until: null, featured_pinned_at: null } : x)));
    setPinningId(null);
  };

  const filteredPosts = postFilter === "all" ? posts : posts.filter((p) => p.category === postFilter);

  // Which post (if any) currently occupies each of the 3 featured slots,
  // used to warn the admin what pinning to that slot will replace.
  const slotOccupants = { 1: null, 2: null, 3: null };
  posts.forEach((p) => {
    if (isActivelyFeatured(p)) slotOccupants[p.featured_slot] = p;
  });

  return {
    posts, loadingPosts, postFilter, setPostFilter, deleting, pinningId,
    filteredPosts, slotOccupants,
    fetchPosts, togglePublish, deletePost, pinFeatured, unpinFeatured,
  };
}