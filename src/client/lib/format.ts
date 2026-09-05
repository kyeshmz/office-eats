export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function formatRating(avg: number | null): string {
  return avg === null ? "No ratings yet" : `${avg.toFixed(1)} ★`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}
