import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import { useSupabaseAuth } from "../../../context/SupabaseAuthContext";
import { F } from "./constants";
import usePosts from "./hooks/usePosts";
import useSubmissions from "./hooks/useSubmissions";
import AdminStyles from "./components/AdminStyles";
import Sidebar from "./components/Sidebar";
import DashboardHeader from "./components/DashboardHeader";
import TabBar from "./components/TabBar";
import PostsTab from "./components/PostsTab";
import SubmissionsTab from "./components/SubmissionsTab";

export default function AdminDashboard({ embedded = false }) {
  const { userRole, loading, roleLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("posts"); // "posts" | "submissions"
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer

  const postsState = usePosts();
  const subsState = useSubmissions();

  useEffect(() => {
    // Wait for both the session AND the role fetch to resolve before gating.
    // userRole starts null while roleLoading is true — redirecting on that
    // transient null was the "roleLoading redirect-loop bug" noted in
    // MIGRATION.md. Only act once we actually know the answer.
    if (loading || roleLoading) return;
    if (userRole !== "radrStaff") { navigate("/"); return; }
    postsState.fetchPosts();
    if (!embedded) subsState.fetchSubmissions();
  }, [userRole, loading, roleLoading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div style={embedded ? { fontFamily: F.b, color: "white" } : { fontFamily: F.b, background: "#0E0E0E", minHeight: "100vh", color: "white" }}>
      <AdminStyles />
      {!embedded && <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} openCount={subsState.openCount} handleLogout={handleLogout} />}

      <div style={{ display: "flex" }}>
        <main className={embedded ? undefined : "adm-main"} style={embedded ? { flex: 1, minWidth: 0 } : { marginLeft: "240px", flex: 1, padding: "40px", minWidth: 0 }}>
          <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
            <DashboardHeader
              posts={postsState.posts}
              subs={subsState.subs}
              openCount={subsState.openCount}
              approvedCount={subsState.approvedCount}
              rejectedCount={subsState.rejectedCount}
              embedded={embedded}
            />
            {!embedded && <TabBar tab={tab} setTab={setTab} openCount={subsState.openCount} />}

            {tab === "posts" && (
              <PostsTab
                posts={postsState.posts}
                filteredPosts={postsState.filteredPosts}
                loadingPosts={postsState.loadingPosts}
                postFilter={postsState.postFilter}
                setPostFilter={postsState.setPostFilter}
                slotOccupants={postsState.slotOccupants}
                deleting={postsState.deleting}
                togglePublish={postsState.togglePublish}
                deletePost={postsState.deletePost}
                pinningId={postsState.pinningId}
                pinFeatured={postsState.pinFeatured}
                unpinFeatured={postsState.unpinFeatured}
              />
            )}

            {tab === "submissions" && (
              <SubmissionsTab
                filteredSubs={subsState.filteredSubs}
                loadingSubs={subsState.loadingSubs}
                subFilter={subsState.subFilter}
                setSubFilter={subsState.setSubFilter}
                expanded={subsState.expanded}
                setExpanded={subsState.setExpanded}
                updatingStatus={subsState.updatingStatus}
                deleting={subsState.deleting}
                updateSubmissionStatus={subsState.updateSubmissionStatus}
                deleteSubmission={subsState.deleteSubmission}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}