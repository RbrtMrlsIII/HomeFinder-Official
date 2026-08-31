/**
 * HomeFinder T07-E controlled presentation destinations.
 * Presentation-only: selects existing SH3D observer-camera entries; never creates
 * or mutates physical model cameras and never authorizes traversal.
 */
export const T07E_PRESENTATION_DESTINATIONS = Object.freeze({
  'H-03': Object.freeze({ cameraName: 'HF H-03 — property-display', house: 'house-1', levelId: 'level1', roomId: 'room-f7418681-094a-400a-9858-b6dedb3e0ef5', roomName: 'Living room' }),
  'H-07': Object.freeze({ cameraName: 'HF H-07 — guide', house: 'house-1', levelId: 'level1', roomId: 'room-7731d0c9-4005-44ef-815d-f38969e4f269', roomName: 'Kitchen' }),
  'H-08': Object.freeze({ cameraName: 'HF H-08 — safety', house: 'house-1', levelId: 'level1', roomId: 'room-575fc1c0-b03a-403b-b9f5-d777fc71d8a2', roomName: 'Bedroom #1' })
});

export function getT07EPresentationDestination(id) {
  return T07E_PRESENTATION_DESTINATIONS[id] || null;
}

export function focusT07EPresentationDestination(selectElement, id) {
  if (!selectElement) return { ok: false, reason: 'missing-selector' };
  const destination = getT07EPresentationDestination(id);
  if (!destination) return { ok: false, reason: 'unknown-destination' };
  const option = Array.from(selectElement.options || []).find((item) =>
    item.textContent?.trim() === destination.cameraName || item.value === destination.cameraName
  );
  if (!option) return { ok: false, reason: 'camera-option-not-ready', destination };
  selectElement.value = option.value;
  selectElement.dispatchEvent(new Event('change', { bubbles: true }));
  return { ok: true, destination, value: option.value };
}

if (typeof window !== 'undefined') {
  window.HomeFinderT07E = Object.freeze({ T07E_PRESENTATION_DESTINATIONS, getT07EPresentationDestination, focusT07EPresentationDestination });
}
