import { useMemo } from "react";
import useGetDeviceTypes from "@/generated/edge-administration/hooks/device_types/useGetDeviceTypes";
import { components } from "@/generated/edge-administration/types";

export type FieldDefinition = components["schemas"]["FieldDefinition"];

export const DEFAULT_DEVICE_TYPE_ID = "default";

/**
 * The default device type's required fields. These are enforced for every device type (see
 * db/sqlalchemy/device.py:_effective_fields_for), so they're guaranteed to exist on every
 * device regardless of its own type - making them the sensible, always-populated candidates
 * for customizable columns in the devices table.
 */
export default function useDeviceMetadataFields() {
  const deviceTypesQuery = useGetDeviceTypes();

  const fields = useMemo(() => {
    const defaultType = (deviceTypesQuery.data ?? []).find(
      (deviceType) => deviceType.type_id === DEFAULT_DEVICE_TYPE_ID,
    );
    if (!defaultType) return [];
    return Object.entries(defaultType.fields).filter(([, field]) => field.required);
  }, [deviceTypesQuery.data]);

  return { fields, isLoading: deviceTypesQuery.isLoading };
}
