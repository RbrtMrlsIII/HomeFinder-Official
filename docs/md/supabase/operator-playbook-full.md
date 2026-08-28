# HomeFinder — Supabase Operator Playbook

## Purpose

This document is the copy/paste companion for the HomeFinder Supabase integration.

It is intentionally written for an operator who needs to establish the expected Supabase storage and Edge Function boundaries quickly without reverse-engineering the repository.

**Authority order**

```text
PROJECT_AUTHORITY.json
        ↓
docs/json/
        ↓
Supabase migrations + Edge Functions
        ↓
Supabase deployed state
```

The snippets below never contain production secrets. Service-role credentials and Firebase service-account JSON must remain Supabase secrets.

---

# 1. Storage authority

## Canonical buckets

```text
listing-images
kyc-documents
```

## Intended security model

```text
listing-images
├── public read
├── authenticated application upload
├── upload mediated by upload-listing-image Edge Function
└── no arbitrary browser write

kyc-documents
├── private
├── upload mediated by upload-kyc-document Edge Function
├── signed read mediated by get-kyc-signed-url Edge Function
└── no direct browser access
```

---

# 2. Supabase SQL — storage foundation

Run this in the Supabase SQL Editor only after reviewing the existing bucket names and policies.

The statements are written to be safe to re-run where practical.

```sql
-- HomeFinder storage authority
-- Canonical buckets:
--   listing-images
--   kyc-documents

insert into storage.buckets (id, name, public)
values
  ('listing-images', 'listing-images', true),
  ('kyc-documents', 'kyc-documents', false)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;
```

## Remove direct client-write policies from the application buckets

Before creating replacement policies, inspect the existing policies:

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;
```

Remove only policies that grant direct browser writes to these HomeFinder buckets.

Example pattern:

```sql
drop policy if exists "HomeFinder listing image direct upload"
on storage.objects;

drop policy if exists "HomeFinder KYC direct upload"
on storage.objects;
```

Do not blindly delete unrelated policies belonging to another application.

---

# 3. Listing-image storage boundary

Listing images are public-read marketplace assets.

The browser should upload through the trusted Edge Function rather than directly using the anon key.

A successful upload should produce a path owned by the authenticated Firebase UID, for example:

```text
listing-images/{firebaseUid}/{listingId}/{filename}
```

The Edge Function must reject paths that do not begin with the authenticated UID boundary.

---

# 4. KYC storage boundary

KYC files are private.

Canonical path:

```text
kyc-documents/{firebaseUid}/{kind}/{filename}
```

where `kind` is a controlled document category such as:

```text
id
broker
```

The browser never receives a permanent public URL.

The browser receives a short-lived signed URL only after the trusted Edge Function authorizes the request.

---

# 5. Required Supabase secrets

Set these through the Supabase project secrets interface or CLI.

Never commit them to Git.

```text
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_JSON
```

`FIREBASE_SERVICE_ACCOUNT_JSON` is the server-side Firebase service-account JSON encoded as a single secret value.

The client must never receive it.

---

# 6. Shared Firebase token verification

All Firebase-authenticated Supabase Edge Functions should use the same shared verification module.

Canonical flow:

```text
Authorization: Bearer <Firebase ID token>
                    ↓
verifyFirebaseIdToken()
                    ↓
Firebase UID
                    ↓
load authoritative users/{uid}
                    ↓
resolve canonicalRole
                    ↓
authorize operation
```

Do not trust a client-supplied UID or role.

---

# 7. Shared canonical role resolver

The role vocabulary is:

```text
owner
seeker
broker
staff
moderator
admin
```

Legacy aliases are boundary-only:

```text
landlord       → owner
property_owner → owner
lessor         → owner
super          → admin
```

The resolver must prefer:

```text
canonicalRole
```

then temporarily fall back to:

```text
accountType
role
```

only for migration compatibility.

---

# 8. Edge Function — upload-listing-image

Use this as the security shape for the listing-image upload function.

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyFirebaseIdToken } from "../_shared/firebase-auth.ts";
import { canonicalRoleFromUser } from "../_shared/kyc-authorization.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const adminClient = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY
);

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const identity = await verifyFirebaseIdToken(req);
    const role = canonicalRoleFromUser(identity.user);

    if (!["owner", "broker"].includes(role)) {
      return Response.json(
        { error: "Listing image upload is not permitted for this role." },
        { status: 403 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    const listingId = String(form.get("listingId") || "").trim();

    if (!(file instanceof File) || !listingId) {
      return Response.json(
        { error: "file and listingId are required" },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${identity.uid}/${listingId}/${crypto.randomUUID()}-${safeName}`;

    const { error } = await adminClient.storage
      .from("listing-images")
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false
      });

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const { data } = adminClient.storage
      .from("listing-images")
      .getPublicUrl(path);

    return Response.json({
      bucket: "listing-images",
      path,
      publicUrl: data.publicUrl
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
});
```

The exact HomeFinder implementation should additionally validate that the authenticated user actually owns or brokers the referenced listing before accepting the upload.

---

# 9. Edge Function — upload-kyc-document

KYC submission is a self-service operation.

It does **not** grant broker authority.

```text
owner / seeker / broker
        ↓
submit KYC
        ↓
pending
        ↓
admin review
        ↓
verified / rejected
```

Security shape:

```ts
const identity = await verifyFirebaseIdToken(req);
const role = canonicalRoleFromUser(identity.user);

if (!["owner", "seeker", "broker"].includes(role)) {
  return Response.json(
    { error: "KYC submission is not permitted for this role." },
    { status: 403 }
  );
}
```

The path must be server-derived:

```ts
const path =
  `${identity.uid}/${kind}/${crypto.randomUUID()}-${safeName}`;
```

Never accept an arbitrary UID from the browser and use it as the storage owner.

---

# 10. Edge Function — get-kyc-signed-url

Only the canonical KYC authorization contract may authorize sensitive KYC reads.

Expected decision:

```text
admin
  ↓
allowed

everything else
  ↓
denied
```

The function should:

1. verify Firebase ID token;
2. resolve the caller's canonicalRole;
3. authorize against the KYC contract;
4. load the target user's private KYC metadata through trusted server-side Firestore access;
5. validate the requested document path;
6. create a short-lived signed URL;
7. return only the signed URL and controlled metadata.

Example authorization shape:

```ts
const identity = await verifyFirebaseIdToken(req);
const callerRole = await resolveCanonicalRoleFromFirestore(identity.uid);

if (callerRole !== "admin") {
  return Response.json(
    { error: "KYC access denied" },
    { status: 403 }
  );
}
```

Do not make `users/{uid}` public merely to make this function work.

---

# 11. KYC contract

The KYC contract is:

```text
docs/json/firebase/kyc-authorization.json
```

Conceptual operations:

```text
submit
  owner / seeker / broker
  self only

signedUrl
  admin
  target user allowed by contract

review
  admin
  target user
```

Important:

**Broker application/submission is not the same thing as broker approval.**

The act of submitting a broker license must never change:

```text
canonicalRole
```

to:

```text
broker
```

Approval must be an explicit privileged state transition.

---

# 12. Deploying Edge Functions

From the repository's Supabase project directory:

```bash
supabase functions deploy upload-listing-image
supabase functions deploy upload-kyc-document
supabase functions deploy get-kyc-signed-url
```

Before deployment, confirm the project is linked to the intended Supabase project.

Set secrets:

```bash
supabase secrets set FIREBASE_PROJECT_ID="homefinder-official"
supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON='...'
```

Never place the service-account value in source control.

---

# 13. Post-deployment verification

Run:

```sql
select id, name, public
from storage.buckets
where id in ('listing-images', 'kyc-documents');
```

Expected:

```text
listing-images | listing-images | true
kyc-documents  | kyc-documents  | false
```

Inspect policies:

```sql
select
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;
```

The expected security outcome is:

```text
listing-images
  public read
  no arbitrary browser write

kyc-documents
  private
  no direct browser read
  no direct browser write
```

---

# 14. Never put these in client code

Never expose:

```text
SERVICE_ROLE_KEY
FIREBASE_SERVICE_ACCOUNT_JSON
private KYC paths
admin authorization decisions
arbitrary target UID authority
```

The browser may know:

```text
Supabase project URL
Supabase anon key
public listing-image URLs
Firebase public configuration
```

Those are not substitutes for server-side authorization.

---

# 15. Repository verification

After changing Supabase state, compare it against:

```text
PROJECT_AUTHORITY.json
docs/json/supabase/backend-authority.json
docs/json/supabase/storage-authority.json
docs/json/firebase/kyc-authorization.json
active_development/supabase/migrations/
active_development/supabase/functions/
```

The desired invariant is:

```text
repository contract
       ==
deployed Supabase behavior
```

If they differ, the discrepancy belongs in:

```text
docs/reconciliation/
```

until resolved.

---

# 16. Emergency rule

If there is uncertainty between convenience and authorization:

```text
DENY
```

and reconcile the contract before weakening a security boundary.

---

## Operator checklist

- [ ] Confirm Supabase project identity
- [ ] Confirm `listing-images` bucket
- [ ] Confirm `kyc-documents` bucket
- [ ] Inspect existing storage policies
- [ ] Remove only conflicting direct-write policies
- [ ] Apply repository migration
- [ ] Configure Firebase service-account secret
- [ ] Deploy shared-auth-dependent Edge Functions
- [ ] Verify KYC signed URL is admin-only
- [ ] Verify KYC submission does not grant broker role
- [ ] Verify listing-image uploads are authenticated and UID-scoped
- [ ] Run HomeFinder integration verification
- [ ] Record deployed-state evidence
