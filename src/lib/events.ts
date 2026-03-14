/** Dispatch after any note save so the sidebar can refresh. */
export function dispatchNoteUpdated() {
  window.dispatchEvent(new CustomEvent('note-updated'))
}
