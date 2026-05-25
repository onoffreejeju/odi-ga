"use client";

import { useRef } from "react";
import { Autocomplete, useJsApiLoader, type Libraries } from "@react-google-maps/api";
import { getGoogleMapsLanguage, getGoogleMapsRegion, type LatLng } from "@/lib/googleMap";

type GooglePlaceInputProps = {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: LatLng) => void;
  placeholder: string;
  className?: string;
};

const libraries: Libraries = ["places"];

export default function GooglePlaceInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className = ""
}: GooglePlaceInputProps) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const language = getGoogleMapsLanguage();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";
  const { isLoaded } = useJsApiLoader({
    id: "odi-ga-google-maps",
    googleMapsApiKey: apiKey,
    libraries,
    language,
    region: getGoogleMapsRegion(language)
  });

  const input = (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={!apiKey}
      className={`${className} ${!apiKey ? "cursor-not-allowed opacity-60" : ""}`}
    />
  );

  if (!apiKey || !isLoaded) {
    return input;
  }

  return (
    <Autocomplete
      onLoad={(autocomplete) => {
        autocompleteRef.current = autocomplete;
      }}
      onPlaceChanged={() => {
        const place = autocompleteRef.current?.getPlace();
        const location = place?.geometry?.location;
        if (!place || !location) {
          return;
        }

        onChange(place.formatted_address || place.name || value);
        onPlaceSelect({
          lat: location.lat(),
          lng: location.lng(),
          name: place.name || place.formatted_address || value
        });
      }}
      options={{
        fields: ["geometry", "name", "formatted_address"],
        types: ["geocode", "establishment"]
      }}
    >
      {input}
    </Autocomplete>
  );
}
