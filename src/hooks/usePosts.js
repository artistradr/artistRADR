import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Fetch all published posts, optionally filtered by category
export function usePosts(category = null) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, "posts"),
          where("status", "==", "published"),
          orderBy("publishedAt", "desc")
        );
        if (category) {
          q = query(
            collection(db, "posts"),
            where("status", "==", "published"),
            where("category", "==", category),
            orderBy("publishedAt", "desc")
          );
        }
        const snap = await getDocs(q);
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };
    fetch();
  }, [category]);

  return { posts, loading, error };
}

// Fetch a single post by slug
export function usePost(slug) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "posts"),
          where("slug", "==", slug),
          where("status", "==", "published")
        );
        const snap = await getDocs(q);
        setPost(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  return { post, loading, error };
}