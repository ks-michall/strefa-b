/** Public release time: Wednesday, 2 December 2026 at 09:30 in Warsaw (CET). */
export const BEZDROZA_LAUNCH_AT="2026-12-02T08:30:00.000Z"
export const BEZDROZA_LAUNCH_MS=Date.parse(BEZDROZA_LAUNCH_AT)
export function bezdrozaIsLocked(now=Date.now()){return now<BEZDROZA_LAUNCH_MS}
