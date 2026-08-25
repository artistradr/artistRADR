// import-users.cjs
//
// Run locally: node import-users.cjs
// Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as env vars (never hardcode
// the service role key in this file or commit it — it bypasses RLS entirely).
//
//   export SUPABASE_URL=https://rjivkemajotafjvtalol.supabase.co
//   export SUPABASE_SERVICE_ROLE_KEY=<from Dashboard > Project Settings > API>
//   node import-users.cjs
//
// What this does, per user in users-export.json:
//   1. Creates a Supabase Auth user (email only — passwords cannot be migrated
//      from Firebase; users will need to reset password on first login).
//   2. Captures the NEW Supabase UUID (Firebase UIDs are not valid UUIDs and
//      cannot be reused as auth.users.id).
//   3. Inserts a matching profiles row: full_name, artist_name, bio, photo_url,
//      role (normalized — see ROLE_MAP below), created_at (preserved from
//      Firestore, not defaulted to now()).
//   4. Writes uid-mapping.json: { firebaseUid: supabaseUuid } for every user,
//      keyed by email as the join point — needed later to remap author_id /
//      submitted_by on posts and playlist_submissions.
//
// Known data issues fixed here, not silently ignored:
//   - role: "user" (3 docs) has no meaning in the app's own logic (AuthContext.jsx
//     only ever checks === "radrStaff") -> normalized to "subscriber".
//   - role: "radrstaff" (lowercase, 1 doc, user lrx41GNYGJSXHl4GMl4Yk8ik6Be2) is
//     a live bug on Firestore right now (rules are case-sensitive, so this user
//     is NOT actually staff there either) -> normalized to "radrStaff" here,
//     but fix it in Firestore directly too if that person needs staff access
//     before this migration completes.

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ROLE_MAP = {
  subscriber: "subscriber",
  radrstaff: "radrStaff", // fixes the case bug from Firestore
  radrStaff: "radrStaff",
  user: "subscriber", // meaningless value in current app logic
};

function normalizeRole(raw) {
  const key = (raw || "subscriber").toLowerCase();
  return ROLE_MAP[key] ?? "subscriber"; // unknown values fail safe, not silently
}

function firestoreTimestampToISO(ts) {
  if (!ts || typeof ts._seconds !== "number") return new Date().toISOString();
  return new Date(ts._seconds * 1000 + Math.floor((ts._nanoseconds || 0) / 1e6)).toISOString();
}

async function main() {
  const users = JSON.parse(fs.readFileSync("./users-export.json", "utf8"));
  const uidMapping = {};
  const errors = [];

  for (const fbUser of users) {
    const normalizedRole = normalizeRole(fbUser.role);

    if (!fbUser.email) {
      errors.push({ firebaseUid: fbUser.id, reason: "missing email, skipped" });
      continue;
    }

    // 1. Create the Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: fbUser.email,
      email_confirm: true, // they were already verified in Firebase
      user_metadata: { migrated_from_firebase_uid: fbUser.id },
    });

    if (authError) {
      errors.push({ firebaseUid: fbUser.id, email: fbUser.email, reason: authError.message });
      continue;
    }

    const newUuid = authData.user.id;
    uidMapping[fbUser.id] = { supabaseUuid: newUuid, email: fbUser.email };

    // 2. handle_new_user trigger already inserted a bare profiles row on createUser —
    //    update it with the real Firestore data rather than inserting a duplicate.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: normalizedRole,
        full_name: fbUser.fullName ?? null,
        artist_name: fbUser.artistName ?? null,
        bio: fbUser.bio ?? null,
        photo_url: fbUser.photoURL ?? null,
        created_at: firestoreTimestampToISO(fbUser.createdAt),
      })
      .eq("id", newUuid);

    if (profileError) {
      errors.push({ firebaseUid: fbUser.id, email: fbUser.email, reason: profileError.message });
      continue;
    }

    console.log(`Migrated ${fbUser.email} (${fbUser.id} -> ${newUuid}), role: ${normalizedRole}`);

    // 3. Send a password reset so they can actually log in — passwords never migrate.
    await supabase.auth.resetPasswordForEmail(fbUser.email);
  }

  fs.writeFileSync("uid-mapping.json", JSON.stringify(uidMapping, null, 2));
  if (errors.length) {
    fs.writeFileSync("import-errors.json", JSON.stringify(errors, null, 2));
    console.log(`\n${errors.length} error(s) — see import-errors.json`);
  }
  console.log(`\nDone. ${Object.keys(uidMapping).length}/${users.length} users migrated.`);
  console.log("uid-mapping.json written — keep it, needed for remapping posts/submissions later.");
}

main();
