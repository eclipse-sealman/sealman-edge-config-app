import TypesManager from "@/features/PlatformTypes/TypesManager";
import DeviceTableColumnsCard from "@/features/PlatformTypes/DeviceTableColumnsCard";
import useGetDeviceTypes from "@/generated/edge-administration/hooks/device_types/useGetDeviceTypes";
import { usePostDeviceType } from "@/generated/edge-administration/hooks/device_types/usePostDeviceType";
import { useUpdateDeviceType } from "@/generated/edge-administration/hooks/device_types/useUpdateDeviceType";
import { useDeleteDeviceType } from "@/generated/edge-administration/hooks/device_types/useDeleteDeviceType";
import useGetEndpointTypes from "@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes";
import { usePostEndpointType } from "@/generated/edge-administration/hooks/endpoint_types/usePostEndpointType";
import { useUpdateEndpointType } from "@/generated/edge-administration/hooks/endpoint_types/useUpdateEndpointType";
import { useDeleteEndpointType } from "@/generated/edge-administration/hooks/endpoint_types/useDeleteEndpointType";
import useGetServiceTypes from "@/generated/edge-administration/hooks/service_types/useGetServiceTypes";
import { usePostServiceType } from "@/generated/edge-administration/hooks/service_types/usePostServiceType";
import { useUpdateServiceType } from "@/generated/edge-administration/hooks/service_types/useUpdateServiceType";
import { useDeleteServiceType } from "@/generated/edge-administration/hooks/service_types/useDeleteServiceType";
import { listRegisteredBrowsers } from "@/lib/browserRegistry";

export default function PlatformTypesSettings() {
  const deviceTypesQuery = useGetDeviceTypes();
  const { postDeviceType } = usePostDeviceType();
  const { updateDeviceType } = useUpdateDeviceType();
  const { deleteDeviceType } = useDeleteDeviceType();

  const endpointTypesQuery = useGetEndpointTypes();
  const { postEndpointType } = usePostEndpointType();
  const { updateEndpointType } = useUpdateEndpointType();
  const { deleteEndpointType } = useDeleteEndpointType();

  const serviceTypesQuery = useGetServiceTypes();
  const { postServiceType } = usePostServiceType();
  const { updateServiceType } = useUpdateServiceType();
  const { deleteServiceType } = useDeleteServiceType();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Platform Types</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Define the device, endpoint and service types available on the platform, and the fields captured for
          each.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <TypesManager
          title="Device Types"
          singularLabel="Device Type"
          description="Types available when creating devices."
          types={deviceTypesQuery.data ?? []}
          isLoading={deviceTypesQuery.isLoading}
          onCreate={async (body) => {
            await postDeviceType(body);
            await deviceTypesQuery.refetch();
          }}
          onUpdate={async (typeId, body) => {
            await updateDeviceType({ typeId, body });
            await deviceTypesQuery.refetch();
          }}
          onDelete={async (typeId) => {
            await deleteDeviceType(typeId);
            await deviceTypesQuery.refetch();
          }}
        />

        <DeviceTableColumnsCard />

        <TypesManager
          title="Endpoint Types"
          singularLabel="Endpoint Type"
          description="Types available when creating endpoints on a device."
          types={endpointTypesQuery.data ?? []}
          isLoading={endpointTypesQuery.isLoading}
          mappingRole={{ value: "ip", label: "IP Address", compatibleTypes: ["string"] }}
          onCreate={async (body) => {
            await postEndpointType({ ...body, mapping: body.mapping ?? {} });
            await endpointTypesQuery.refetch();
          }}
          onUpdate={async (typeId, body) => {
            await updateEndpointType({ typeId, body });
            await endpointTypesQuery.refetch();
          }}
          onDelete={async (typeId) => {
            await deleteEndpointType(typeId);
            await endpointTypesQuery.refetch();
          }}
        />

        <TypesManager
          title="Service Types"
          singularLabel="Service Type"
          description="Types available when creating services on an endpoint."
          types={serviceTypesQuery.data ?? []}
          isLoading={serviceTypesQuery.isLoading}
          mappingRole={{ value: "port", label: "Port", compatibleTypes: ["integer", "number"] }}
          browserKindOptions={listRegisteredBrowsers()}
          onCreate={async (body) => {
            await postServiceType({ ...body, mapping: body.mapping ?? {} });
            await serviceTypesQuery.refetch();
          }}
          onUpdate={async (typeId, body) => {
            await updateServiceType({ typeId, body });
            await serviceTypesQuery.refetch();
          }}
          onDelete={async (typeId) => {
            await deleteServiceType(typeId);
            await serviceTypesQuery.refetch();
          }}
        />
      </div>
    </div>
  );
}
