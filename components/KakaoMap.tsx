"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMap, type LatLng } from "@/lib/kakaoMap";

type KakaoMapProps = {
  origin?: LatLng | null;
  destination?: LatLng | null;
  errands?: LatLng[];
  className?: string;
};

export default function KakaoMap({
  origin,
  destination,
  errands = [],
  className = ""
}: KakaoMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    loadKakaoMap()
      .then(() => {
        const center = origin || destination || errands[0] || { lat: 33.4996, lng: 126.5312 };
        const map = new window.kakao.maps.Map(ref.current, {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level: 7
        });
        const bounds = new window.kakao.maps.LatLngBounds();

        const addMarker = (point: LatLng, color: string) => {
          const position = new window.kakao.maps.LatLng(point.lat, point.lng);
          bounds.extend(position);
          return new window.kakao.maps.Marker({
            map,
            position,
            title: point.name,
            image: new window.kakao.maps.MarkerImage(
              `https://placehold.co/36x36/${color}/ffffff.png?text=%20`,
              new window.kakao.maps.Size(36, 36),
              { offset: new window.kakao.maps.Point(18, 36) }
            )
          });
        };

        if (origin) addMarker(origin, "10b981");
        if (destination) addMarker(destination, "ef4444");
        errands.forEach((errand) => addMarker(errand, "2563eb"));

        if (origin && destination) {
          new window.kakao.maps.Polyline({
            map,
            path: [
              new window.kakao.maps.LatLng(origin.lat, origin.lng),
              new window.kakao.maps.LatLng(destination.lat, destination.lng)
            ],
            strokeWeight: 5,
            strokeColor: "#10b981",
            strokeOpacity: 0.9,
            strokeStyle: "solid"
          });
        }

        if (origin || destination || errands.length > 0) {
          map.setBounds(bounds);
        }
      })
      .catch(() => setError("Kakao Maps 키를 설정하면 지도가 표시됩니다."));
  }, [destination, errands, origin]);

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
      <div ref={ref} className="h-full min-h-[240px] w-full" />
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-semibold text-slate-500">
          {error}
        </div>
      ) : null}
    </div>
  );
}
