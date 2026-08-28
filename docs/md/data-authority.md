# Data Authority

| Domain | Canonical authority |
|---|---|
| Authentication identity | Firebase Auth |
| User identity record | Firestore `users/{uid}` |
| Current role | `users/{uid}.canonicalRole` |
| Property listings | `propertyListings` |
| Wanted listings | `wantedListings` |
| Public profile projection | `publicProfiles` |
| Supabase | Integrated secondary system; must consume aligned authority contracts |

Legacy fields may exist for compatibility but must not become independent authorization authorities.
