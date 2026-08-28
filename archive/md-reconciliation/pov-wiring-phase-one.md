# HomeFinder POV Wiring Phase 1 — 2026-08-23

## Authority
- Master 3D scene: `master/HomeFinder.sh3d`
- Logical POV authority: recovered `camera-registry.json` + `section-camera-choreography.json`
- SoT status: living/versioned; this wiring is adjustable and must remain traceable to later changes.

## Current route set
- main-hall → index.html (MAIN HALL)
- login → login.html (LOGIN ROOM)
- register → register.html (REGISTER ROOM)
- market → market.html (MARKET)
- profile → profile.html (PROFILE SUITE)
- broker-hq → broker-hq.html (BROKER HQ)
- admin → admin.html (OPERATIONS)
- moderator → moderator.html (OPERATIONS)
- staff → staff.html (OPERATIONS)
- financing-guide → financing.html (REFERENCE)
- legal-privacy → privacy.html (REFERENCE)
- legal-terms → terms.html (REFERENCE)

## Wiring rule
Each page section/tab references a logical POV ID. The logical POV is the application-level identity; the corresponding Sweet Home 3D stored camera is a physical implementation. Native HTML scroll/tab navigation remains authoritative. Camera movement is presentation only. Reduced motion falls back to snap/short fade and HTML remains usable.

## Camera implementation
The master scene currently contains five named usable interior/exterior cameras plus the normal observer/top cameras. We therefore do **not** overwrite those cameras. New HomeFinder cameras should be created as stored camera copies/variants named `HF <POV-ID> — <anchor>`. They must be visually tuned in Sweet Home 3D against the target room/object before being promoted to confirmed.

## Important corrections
- Privacy and Terms are separate current routes and now receive distinct semantic camera variants: `LGL-01` for privacy and `LGL-02` for terms.
- The older census names `listings`, `property-gallery`, `map`, `finance`, `messages`, `favorites`, `settings` are not treated as current route IDs. Their semantics are retained only where they map into current pages/sections.
- A repeated logical POV ID across several sections does not mean those sections must use identical framing; the choreography's orientation/focus hints are allowed to refine the same station without inventing a second room.

## Promotion gate
A POV becomes CONFIRMED only after visual inspection in the frozen master scene and confirmation that the intended physical UI anchor is framed/visible. Until then it remains CANDIDATE.
