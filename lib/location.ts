import type { LatLng } from "@/lib/googleMap";

export type NearbyErrand = {
  id: string;
  category: string;
  description: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_name: string;
  created_at: string;
  distanceKm: number;
};

export function distanceKm(a: Pick<LatLng, "lat" | "lng">, b: Pick<LatLng, "lat" | "lng">) {
  const radiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * radiusKm * Math.asin(Math.sqrt(h));
}

export function currentLocationPoint(lat: number, lng: number): LatLng {
  return {
    lat,
    lng,
    name: "현위치"
  };
}

export function toRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  return `${Math.floor(hours / 24)}일 전`;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
