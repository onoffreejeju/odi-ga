export type LatLng = {
  lat: number;
  lng: number;
  name: string;
};

export function getGoogleMapsLanguage() {
  if (typeof navigator === "undefined") {
    return "ko";
  }

  return navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
}

export function getGoogleMapsRegion(language: string) {
  return language === "ko" ? "KR" : "US";
}
