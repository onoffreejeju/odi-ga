"use client";

import { useMemo } from "react";
import {
  GoogleMap as ReactGoogleMap,
  MarkerF,
  PolylineF,
  useJsApiLoader,
  type Libraries
} from "@react-google-maps/api";
import { getGoogleMapsLanguage, getGoogleMapsRegion, type LatLng } from "@/lib/googleMap";

type GoogleMapProps = {
  origin?: LatLng | null;
  destination?: LatLng | null;
  errands?: LatLng[];
  className?: string;
};

const libraries: Libraries = ["places"];
const fallbackCenter = { lat: 33.4996, lng: 126.5312 };
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  gestureHandling: "greedy"
};

export default function GoogleMap({
  origin,
  destination,
  errands = [],
  className = ""
}: GoogleMapProps) {
  const language = getGoogleMapsLanguage();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "odi-ga-google-maps",
    googleMapsApiKey: apiKey,
    libraries,
    language,
    region: getGoogleMapsRegion(language)
  });

  const center = useMemo(
    () => origin || destination || errands[0] || fallbackCenter,
    [destination, errands, origin]
  );
  const path = useMemo(
    () =>
      origin && destination
        ? [
            { lat: origin.lat, lng: origin.lng },
            { lat: destination.lat, lng: destination.lng }
          ]
        : [],
    [destination, origin]
  );

  if (!apiKey) {
    return (
      <div
        className={`flex min-h-[240px] items-center justify-center bg-slate-100 px-6 text-center text-sm font-semibold text-slate-500 dark:bg-slate-800 ${className}`}
      >
        Google Maps API 키를 설정해주세요
      </div>
    );
  }

  if (loadError || !isLoaded) {
    return (
      <div
        className={`flex min-h-[240px] items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500 dark:bg-slate-800 ${className}`}
      >
        지도 로딩 중...
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
      <ReactGoogleMap
        mapContainerClassName="h-full min-h-[240px] w-full"
        center={center}
        zoom={origin && destination ? 11 : 13}
        options={mapOptions}
      >
        {origin ? (
          <MarkerF
            position={{ lat: origin.lat, lng: origin.lng }}
            title={origin.name}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: "#10b981",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3
            }}
          />
        ) : null}
        {destination ? (
          <MarkerF
            position={{ lat: destination.lat, lng: destination.lng }}
            title={destination.name}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: "#ef4444",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3
            }}
          />
        ) : null}
        {errands.map((errand) => (
          <MarkerF
            key={`${errand.lat}-${errand.lng}-${errand.name}`}
            position={{ lat: errand.lat, lng: errand.lng }}
            title={errand.name}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#2563eb",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2
            }}
          />
        ))}
        {path.length ? (
          <PolylineF
            path={path}
            options={{
              strokeColor: "#10b981",
              strokeOpacity: 0.9,
              strokeWeight: 5
            }}
          />
        ) : null}
      </ReactGoogleMap>
    </div>
  );
}
