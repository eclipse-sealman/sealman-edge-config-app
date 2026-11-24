import { useQueryClient } from "@tanstack/react-query";
import { Accordion } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MappedEndpoint } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import useGetDeviceMetadata from "@/generated/edge-administration/hooks/device_metadata/useGetDeviceMetadata";
import { usePermissions } from "@/features/authorization/permissions/use-permissions";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import ExtensionOutlet from "@/features/Extensions/outlets/ExtensionOutlet";
import { useOutletUser } from "@/features/Extensions/outlets/useOutletUser";
import EndpointAccordionItem from "./EndpointAccordionItem";
import { endpointListKey } from "./overviewMerge";

interface props {
  endpoint: MappedEndpoint | null;
  /** The service tab to show first. */
  serviceId?: string | null;
  deviceId: string;
  onClose: () => void;
  onChanged: () => void;
}

/** The list view's expanded endpoint row (endpoint details, services, editing) shown as a popup. */
export default function EndpointDetailsDialog({ endpoint, serviceId = null, deviceId, onClose, onChanged }: props) {
  const queryClient = useQueryClient();
  const outletUser = useOutletUser();
  const metadata = useGetDeviceMetadata(deviceId);
  const { hasPermission: canWrite } = usePermissions({ deviceId, permissionKey: PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE });

  if (!endpoint) return null;
  const key = endpointListKey(endpoint);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-5xl gap-3 overflow-y-auto p-4 pt-10">
        <DialogTitle className="sr-only">Endpoint details</DialogTitle>
        <DialogDescription className="sr-only">Details and services of the selected endpoint.</DialogDescription>
        {/* Controlled without a change handler: the row stays expanded inside the popup. */}
        <Accordion type="single" value={key} className="w-full">
          <EndpointAccordionItem
            key={key}
            endpoint={endpoint}
            deviceId={deviceId}
            onCreated={onChanged}
            onOpenDetails={() => {}}
            initialServiceId={serviceId}
          />
        </Accordion>
        {endpoint.endpoint_id && !metadata.isLoading && (
          <ExtensionOutlet
            target="endpoint"
            placement="section"
            context={{
              user: outletUser,
              deviceId,
              deviceTypeId: metadata.data?.typeId ?? "",
              endpointId: endpoint.endpoint_id,
              endpointTypeId: endpoint.type_id,
              canEdit: canWrite,
            }}
            onDataChanged={() => {
              queryClient.invalidateQueries({ queryKey: ["get", "/{device}/metadata"] });
              onChanged();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
