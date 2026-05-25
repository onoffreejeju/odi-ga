export type LatLng = {
  lat: number;
  lng: number;
  name: string;
};

declare global {
  interface Window {
    kakao?: any;
  }
}

let loadingScript: Promise<void> | null = null;

export function loadKakaoMap() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.kakao?.maps) {
    return Promise.resolve();
  }

  if (loadingScript) {
    return loadingScript;
  }

  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!appKey) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_KAKAO_MAP_KEY"));
  }

  loadingScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = () => reject(new Error("Failed to load Kakao Maps SDK"));
    document.head.appendChild(script);
  });

  return loadingScript;
}

export async function searchPlace(keyword: string): Promise<LatLng | null> {
  await loadKakaoMap();

  return new Promise((resolve) => {
    const places = new window.kakao.maps.services.Places();
    places.keywordSearch(keyword, (result: any[], status: string) => {
      if (status !== window.kakao.maps.services.Status.OK || !result[0]) {
        resolve(null);
        return;
      }

      resolve({
        lat: Number(result[0].y),
        lng: Number(result[0].x),
        name: result[0].place_name || keyword
      });
    });
  });
}
