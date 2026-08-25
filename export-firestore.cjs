const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const serviceAccount = require("./serviceaccount.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function exportCollection(name) {
  const snap = await db.collection(name).get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  fs.writeFileSync(`${name}-export.json`, JSON.stringify(docs, null, 2));
  console.log(`${name}: exported ${docs.length} docs -> ${name}-export.json`);
  return docs;
}

(async () => {
  await exportCollection("posts");
  await exportCollection("playlist_submissions");
  await exportCollection("users");
  process.exit(0);
})();
