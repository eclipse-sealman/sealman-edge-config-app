import React, { useState } from "react";
import { Input } from "./FormElements";

export interface LocationErrors {
  latitude: string;
  longitude: string;
}

export interface LatitudeLongitudeInputProps {
  latitude: string;
  longitude: string;
  required?: boolean;
  onChange: (latitude: string, longitude: string, errors: LocationErrors) => void;
}

const COORDINATE_REGEX = {
  // Allows only numbers, minus sign, and decimal point
  VALID_FORMAT: /^-?\d+(\.\d+)?$/,
  // Checks for alphabetic characters
  HAS_ALPHABETIC: /[a-zA-Z]/,
};

export default function LatitudeLongitudeInput({
  latitude,
  longitude,
  required = false,
  onChange,
}: LatitudeLongitudeInputProps) {
  const [latitudeState, setLatitudeState] = useState(latitude);
  const [longitudeState, setLongitudeState] = useState(longitude);
  const [errors, setErrors] = useState<LocationErrors>({
    latitude: "",
    longitude: "",
  });

  const validateLatitude = (value: string) => {
    const lat = value.trim();

    if (!lat) {
      if (required) return "Latitude is required";
      return "";
    }

    if (COORDINATE_REGEX.HAS_ALPHABETIC.test(lat)) {
      return `Latitude must not contain alphabetic characters`;
    }

    if (!COORDINATE_REGEX.VALID_FORMAT.test(lat)) {
      return `Invalid latitude format`;
    }

    const latNum = parseFloat(lat);

    if (isNaN(latNum)) return "Latitude must be a number";

    if (latNum < -90 || latNum > 90) return "Latitude must be between -90 and 90";

    if (lat.split(".")[1] && lat.split(".")[1].length > 16) {
      return "Latitude should have max 16 decimal places";
    }

    return "";
  };

  const validateLongitude = (value: string) => {
    const long = value.trim();

    if (!long) {
      if (required) return "Longitude is required";
      return "";
    }

    if (COORDINATE_REGEX.HAS_ALPHABETIC.test(long)) {
      return `Longitude must not contain alphabetic characters`;
    }

    if (!COORDINATE_REGEX.VALID_FORMAT.test(long)) {
      return `Invalid longitude format`;
    }

    const longNum = parseFloat(long);

    if (isNaN(longNum)) return "Longitude must be a number";

    if (longNum < -180 || longNum > 180) return "Longitude must be between -180 and 180";

    if (long.split(".")[1] && long.split(".")[1].length > 16) {
      return "Longitude should have max 16 decimal places";
    }

    return "";
  };

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLatitudeState(value);
    const errorsNew = {
      ...errors,
      latitude: validateLatitude(value),
    };
    setErrors(errorsNew);
    onChange(value, longitudeState, errorsNew);
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLongitudeState(value);
    const errorsNew = {
      ...errors,
      longitude: validateLongitude(value),
    };
    setErrors(errorsNew);
    onChange(latitudeState, value, errorsNew);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Prevent default paste behavior
    e.preventDefault();

    // Get the pasted text from clipboard
    const pastedText = e.clipboardData.getData('text');

    // Split the text by first space
    const parts = pastedText.split(',');

    let newLatitude = latitudeState;
    let newLongitude = longitudeState;
    const errorsNew = {
        ...errors,
      };

    // If there's at least one part, set the latitude field
    if (parts.length >= 1) {
      setLatitudeState(parts[0].trim());
      const latitudeError = validateLatitude(parts[0].trim());
      errorsNew.latitude = latitudeError;
      newLatitude = parts[0];
    }

    // If there's a second part (or more), set the longitude field
    if (parts.length >= 2) {
      setLongitudeState(parts[1].trim());
      const longitudeError = validateLongitude(parts[1].trim());
      errorsNew.longitude = longitudeError;
      newLongitude = parts[1];
    }

    setErrors(errorsNew);
    onChange(newLatitude, newLongitude, errorsNew);
  };

  return (
    <div>
      <div className="flex flex-row gap-2">
        <div className="flex flex-row gap-2 items-center">
              <label htmlFor="latitude" className="pr-2">
                Latitude:
              </label>
              <Input
                id="latitude"
                type="text"
                value={latitudeState}
                onChange={handleLatitudeChange}
                placeholder="Enter latitude (e.g., 40.7128)"
                onPaste={handlePaste}
                className={`${errors.latitude ? "border-red-500" : ""}`}
                autoComplete="off"
              />
              {errors.latitude && <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>}
        </div>
        <div className="flex flex-row gap-2 items-center">
          
            <label htmlFor="longitude" className="pr-2">
              Longitude:
            </label>
            <Input
              id="longitude"
              type="text"
              value={longitudeState}
              onChange={handleLongitudeChange}
              placeholder="Enter longitude (e.g., -74.0060)"
              className={`${errors.longitude ? "border-red-500" : ""}`}
              autoComplete="off"
            />
            {errors.longitude && <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>}
          
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        * You can paste a location copied from Google Maps directly into the Latitude field — both Latitude and Longitude will be filled in automatically.
      </div>
    </div>
  );
}
