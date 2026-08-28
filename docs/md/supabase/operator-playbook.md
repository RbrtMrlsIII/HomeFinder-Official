# Supabase operator playbook (trimmed)

> Full historical text: `operator-playbook-full.md`

> Code/config: `active_development/supabase/`



## Purpose


This document is the copy/paste companion for the HomeFinder Supabase integration.

It is intentionally written for an operator who needs to establish the expected Supabase storage and Edge Function boundaries quickly without reverse-engineering the repository.

**Authority order**

```text
PROJECT_AUTHORITY.json
        ↓

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

## Remove direct client-write policies from the application buckets


Before creating replacement policies, inspect the existing policies:

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,

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

## Secrets
Never commit service role keys. Use host secret store / `supabase secrets`.
