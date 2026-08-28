-- HomeFinder storage authority.
-- Browser clients do NOT receive direct write policies. All writes go through
-- Edge Functions that verify Firebase identity and enforce canonicalRole.
insert into storage.buckets (id, name, public)
values
  ('listing-images', 'listing-images', true),
  ('kyc-documents', 'kyc-documents', false)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

-- Public marketplace media is readable by anyone. Direct browser writes remain
-- intentionally absent; upload-listing-image uses the Supabase service role.
drop policy if exists "homefinder_public_listing_images_read" on storage.objects;
create policy "homefinder_public_listing_images_read"
on storage.objects
for select
to public
using (bucket_id = 'listing-images');

-- kyc-documents is private and intentionally has no anon/authenticated object
-- policies. get-kyc-signed-url and upload-kyc-document use service-role access
-- only after Firebase identity/canonicalRole authorization.
