"use client";

import { memo, useState, useCallback, type FC } from "react";
import Button from "./button";

interface LocationPickerProps {
  label?: string;
  address: string;
  latitude?: string;
  longitude?: string;
  onLocationChange: (data: {
    address: string;
    latitude: string;
    longitude: string;
  }) => void;
  error?: string;
}

const LocationPicker: FC<LocationPickerProps> = ({
  label,
  address,
  latitude,
  longitude,
  onLocationChange,
  error,
}) => {
  const [isPickingLocation, setIsPickingLocation] = useState(false);

  const handlePickLocation = useCallback(() => {
    // Get current location or use default coordinates
    const defaultLat = latitude || "28.6139";
    const defaultLng = longitude || "77.2090";

    // Open Google Maps in a new window for location picking
    const mapsUrl = `https://www.google.com/maps/@${defaultLat},${defaultLng},15z`;
    const newWindow = window.open(mapsUrl, "_blank", "width=800,height=600");

    setIsPickingLocation(true);

    // Instructions for user
    alert(
      "Instructions:\n\n" +
      "1. Find your location on Google Maps\n" +
      "2. Right-click on the exact location\n" +
      "3. Click on the coordinates (numbers) to copy them\n" +
      "4. Come back and paste the coordinates below\n\n" +
      "Note: You can also copy the address from Google Maps"
    );

    setIsPickingLocation(false);
  }, [latitude, longitude]);

  const handleAddressChange = useCallback(
    (value: string) => {
      onLocationChange({
        address: value,
        latitude: latitude || "",
        longitude: longitude || "",
      });
    },
    [latitude, longitude, onLocationChange]
  );

  const handleCoordinatesPaste = useCallback(() => {
    const coords = prompt(
      "Paste coordinates from Google Maps (format: latitude, longitude)\n" +
      "Example: 28.6139, 77.2090"
    );

    if (coords) {
      const parts = coords.split(",").map((p) => p.trim());
      if (parts.length === 2) {
        onLocationChange({
          address: address,
          latitude: parts[0],
          longitude: parts[1],
        });
      } else {
        alert("Invalid format. Please use: latitude, longitude");
      }
    }
  }, [address, onLocationChange]);

  const handleUseCurrentLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationChange({
            address: address,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
          alert("Location captured successfully!");
        },
        (error) => {
          alert("Could not get your location. Please enable location services.");
          console.error(error);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }, [address, onLocationChange]);

  return (
    <div className="w-full space-y-3">
      {label && (
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          {label}
        </label>
      )}

      <textarea
        value={address}
        onChange={(e) => handleAddressChange(e.target.value)}
        placeholder="Enter address"
        rows={3}
        className="flex w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handlePickLocation}
        >
          📍 Open Google Maps
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleCoordinatesPaste}
        >
          📋 Paste Coordinates
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleUseCurrentLocation}
        >
          🎯 Use Current Location
        </Button>
      </div>

      {(latitude && longitude) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-medium text-green-900">
            📌 Location saved
          </p>
          <p className="text-xs text-green-700 mt-1">
            Coordinates: {latitude}, {longitude}
          </p>
          <a
            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
          >
            View on Google Maps →
          </a>
        </div>
      )}

      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
};

export default memo(LocationPicker);
