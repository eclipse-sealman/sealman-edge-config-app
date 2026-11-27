import ExtensionOutlet from "@/features/Extensions/outlets/ExtensionOutlet";
import { useOutletUser } from "@/features/Extensions/outlets/useOutletUser";
import useGetDeviceMetadata from "@/generated/edge-administration/hooks/device_metadata/useGetDeviceMetadata";
import type { ListRowSlot } from "@/features/PlatformTypes/FieldValueInput";

interface props {
  deviceId: string;
  endpointId: string;
  endpointTypeId: string;
  fieldKey: string;
  row: ListRowSlot;
  onDataChanged: () => void;
}

/**
 * The extension slot at the end of a list row of an endpoint being edited. Extensions change the row
 * in the form (the edit is permission-gated); the user saves with Save.
 */
export default function EndpointListRowOutlet({ deviceId, endpointId, endpointTypeId, fieldKey, row, onDataChanged }: props) {
  const user = useOutletUser();
  const metadata = useGetDeviceMetadata(deviceId);
  if (metadata.isLoading) return null;
  return (
    <ExtensionOutlet
      target="endpoint"
      placement="field-row"
      context={{ user, deviceId, deviceTypeId: metadata.data?.typeId ?? "", endpointId, endpointTypeId, canEdit: true }}
      onDataChanged={onDataChanged}
      extraProps={{ fieldKey, item: row.item, updateItem: row.updateItem }}
    />
  );
}
