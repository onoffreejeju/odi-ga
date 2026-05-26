"use client";

import { useCallback, useEffect, useState } from "react";
import { currentLocationPoint } from "@/lib/location";
import type { LatLng } from "@/lib/googleMap";

export function useCurrentLocation(autoDetect = true) {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setError("브라우저에서 위치 기능을 지원하지 않습니다.");
      return;
    }

    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(
          currentLocationPoint(position.coords.latitude, position.coords.longitude)
        );
        setLoading(false);
      },
      () => {
        setError("현위치를 가져오지 못했습니다. 위치 권한을 확인해주세요.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000
      }
    );
  }, []);

  useEffect(() => {
    if (autoDetect) {
      detect();
    }
  }, [autoDetect, detect]);

  return {
    location,
    setLocation,
    error,
    loading,
    detect
  };
}
