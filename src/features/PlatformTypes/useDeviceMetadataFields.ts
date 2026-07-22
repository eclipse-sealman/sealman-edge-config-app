import { useMemo } from "react";
import useGetDeviceTypes from "@/generated/edge-administration/hooks/device_types/useGetDeviceTypes";
import { components } from "@/generated/edge-administration/types";

export type FieldDefinition = components["schemas"]["FieldDefinition"];

/** The union of fields across every device type, deduped by key (first-seen definition wins). */
export default function useDeviceMetadataFields() {
  const deviceTypesQuery = useGetDeviceTypes();

  const fields = useMemo(() => {
    const map = new Map<string, FieldDefinition>();
    for (const deviceType of deviceTypesQuery.data ?? []) {
      for (const [key, field] of Object.entries(deviceType.fields)) {
        if (map.has(key)) continue;
        map.set(key, field);
      }
    }
    return [...map.entries()];
  }, [deviceTypesQuery.data]);

  return { fields, isLoading: deviceTypesQuery.isLoading };
}
