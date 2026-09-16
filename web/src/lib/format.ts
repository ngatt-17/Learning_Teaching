const pad = (n: number) => String(n).padStart(2, '0');

/** "23:59, 24/09/2026" — the format used in the exam header. */
export function formatDeadline(iso: string | null | undefined): string {
  if (!iso) return 'Không có hạn nộp';
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "Tháng 9 16 tại 14:50" — mirrors the LMS-style start line in the exam header. */
export function formatStarted(ms: number): string {
  const d = new Date(ms);
  return `Tháng ${d.getMonth() + 1} ${d.getDate()} tại ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "14 Phút, 54 Giây" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)} Phút, ${pad(s % 60)} Giây`;
}

export function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** Convert an ISO string to the value of an <input type="datetime-local">. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
