// src/studio/pages/MagazinePages.jsx
// The Magazine (blog posts, new post, edit post) inside the Studio shell.
// Same components as the old /admin pages, rendered without their own sidebar.
import AdminDashboard from "../../pages/Admin/AdminDashboard/AdminDashboard";
import PostEditor from "../../pages/Admin/PostEditor";

const vars = {
  "--color-red": "#ff5a36",
  "--color-cyan": "#5ce1e6",
  "--font-body": '"DM Sans", system-ui, sans-serif',
  "--font-display": '"DM Sans", system-ui, sans-serif',
};

export function MagazineList() {
  return <div style={vars}><AdminDashboard embedded /></div>;
}

export function MagazineEditor() {
  return <div style={vars}><PostEditor embedded /></div>;
}
