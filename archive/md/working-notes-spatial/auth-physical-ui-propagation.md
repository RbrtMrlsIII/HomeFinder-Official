# Phase 13 Auth Physical UI Propagation

## Scope
Login and Register are the first form-heavy consumers of the Phase 12 Animation Root + Physical UI State Machine + Responsive Transformation subsystem.

## Invariants
- Native HTML form behavior remains authoritative.
- Firebase authentication/registration logic is unchanged by presentation state.
- Cameras remain presentation-only.
- Object identity remains semantic and stable across viewport modes.
- Reduced-motion collapses transitions without changing state meaning.

## Login POV wiring
- L-01 → login-identity-terminal
- L-02 → login-recovery-control
- L-03 → login-social-terminal
- L-04 → login-registration-doorway
- L-05 → login-credits-wall

## Register POV wiring
- R-01 → register-submit-console
- R-02 → register-contact-station
- R-03 → register-confirmation-station
- R-04 → register-account-type-station
- R-05 → register-password-station
- R-06 → register-social-terminal
- R-07 → register-login-doorway

## Responsive root
Auth object roots preserve semantic identity across mobile portrait, mobile landscape, compact, tablet, desktop, and wide desktop. Form controls remain HTML-native and maintain a minimum 44px interaction target.
