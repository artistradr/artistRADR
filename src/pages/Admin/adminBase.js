// Where the Magazine (posts list, new post, edit post) lives.
// Public site build: /admin. Studio build: inside the Studio shell at /studio/magazine.
const IS_STUDIO = import.meta.env.VITE_APP_MODE === "studio";
export const ADMIN_BASE = IS_STUDIO ? "/studio/magazine" : "/admin";
