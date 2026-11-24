import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { InlineAlert, LoadingState } from "@/components/ui/page-state";
import SearchableSelect from "@/components/Input/SearchableSelect";
import { getErrorMessage } from "@/lib/errors";
import useGetEndpointTypes from "@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes";
import useGetServiceTypes from "@/generated/edge-administration/hooks/service_types/useGetServiceTypes";
import {
  useEndpointServices, type DeviceEndpoint, type EndpointChoices, type Finding, type InputEndpoint, type InputVariable, type RowChoices,
  type ServiceChoices, type Values,
} from "@/features/ModuleConfigTemplates/api";
import { VariableForm } from "@/features/ModuleConfigTemplates/components";

/** Whether a slot reads fields of a chosen service (and so needs one). */
export const needsService = (slot: InputEndpoint) => (slot.service_fields?.length ?? 0) > 0;

/** The rows of an endpoint's list field: the object items of its value. */
export function rowsOf(endpoint: DeviceEndpoint | undefined, field: string): Record<string, unknown>[] {
  const value = endpoint?.fields[field];
  return Array.isArray(value)
    ? value.filter((row): row is Record<string, unknown> => !!row && typeof row === "object" && !Array.isArray(row))
    : [];
}

/** Whether every list field the slots read rows of has a row chosen (the server would say which is missing). */
export const rowsChosen = (slots: InputEndpoint[], rows: RowChoices) =>
  slots.every((s) => Object.keys(s.row_fields ?? {}).every((field) => rows[s.key]?.[field]));

const without = <T,>(map: Record<string, T>, key: string) => Object.fromEntries(Object.entries(map).filter(([k]) => k !== key));

/** `map` without the given keys. */
export const withoutKeys = <T,>(map: Record<string, T>, keys: string[]) => Object.fromEntries(Object.entries(map).filter(([k]) => !keys.includes(k)));

/** Clears the choices of slots: `choice` drops the endpoint with its service and rows, `service` only the service. Must apply to the
 * latest state (sections share it and may clear in the same commit), so it takes keys, not a copy of the render-time choices. */
export type ClearChoices = (keys: string[], scope: "choice" | "service") => void;

/** `rows` with the row of one slot's list field set, or removed when `rowId` is undefined. */
function withRow(rows: RowChoices, slotKey: string, field: string, rowId: string | undefined): RowChoices {
  const slotRows = { ...without(rows[slotKey] ?? {}, field), ...(rowId !== undefined && { [field]: rowId }) };
  const rest = without(rows, slotKey);
  return Object.keys(slotRows).length > 0 ? { ...rest, [slotKey]: slotRows } : rest;
}

/** Whether a type is allowed by a slot's list of type ids (empty or missing means any). */
const typeFits = (allowed: string[] | undefined, typeId: string) => !allowed?.length || allowed.includes(typeId);

/** The labels of the allowed types, in the slot's order; a type that no longer exists is shown by its id. */
const typeLabels = (allowed: string[], types?: { type_id: string; label: string }[]) =>
  allowed.map((id) => types?.find((t) => t.type_id === id)?.label ?? id).join(", ");

/** Endpoint dropdowns, then the variable inputs, of the top level or of one copy group. */
export function InputsSection({
  deviceId, variables, slots, emptyText, values, setValues, endpoints, setEndpoints, services, setServices, rows, setRows, clearChoices, findings, blocked,
  deviceEndpoints, endpointsLoading, endpointsError,
}: {
  deviceId: string;
  variables: InputVariable[];
  slots: InputEndpoint[];
  /** shown when there is nothing to fill in */
  emptyText?: string;
  values: Values;
  setValues: (v: Values) => void;
  endpoints: EndpointChoices;
  services: ServiceChoices;
  /** gets the endpoint, service and row choices together: changing an endpoint clears its service and rows */
  setEndpoints: (endpoints: EndpointChoices, services: ServiceChoices, rows: RowChoices) => void;
  setServices: (v: ServiceChoices) => void;
  rows: RowChoices;
  setRows: (next: RowChoices) => void;
  clearChoices: ClearChoices;
  findings: Finding[];
  blocked: boolean;
  deviceEndpoints?: DeviceEndpoint[];
  endpointsLoading: boolean;
  endpointsError?: string;
}) {
  return (
    <>
      {slots.length > 0 && (
        <EndpointSlots deviceId={deviceId} slots={slots} endpoints={deviceEndpoints} loading={endpointsLoading}
                       error={endpointsError} value={endpoints} onChange={setEndpoints} services={services} onServicesChange={setServices}
                       rows={rows} onRowsChange={setRows} clearChoices={clearChoices} disabled={blocked} />
      )}
      <VariableForm variables={variables} values={values} onChange={setValues} findings={findings} disabled={blocked}
                    keyOf={(d) => (d as InputVariable).key ?? d.name} emptyText={slots.length > 0 ? "" : (emptyText ?? "This template has no variables.")} />
    </>
  );
}

/** One dropdown per endpoint slot: the endpoint of this device that fills its `${endpoint[slot].*}` placeholders;
 * under it, for slots that read a service, one of that endpoint's services, and for each list field the slot reads, one of its rows. */
export function EndpointSlots({ deviceId, slots, endpoints, loading, error, value, onChange, services, onServicesChange, rows, onRowsChange, clearChoices, disabled }: {
  deviceId: string;
  slots: InputEndpoint[];
  endpoints?: DeviceEndpoint[];
  loading: boolean;
  error?: string;
  value: EndpointChoices;
  onChange: (endpoints: EndpointChoices, services: ServiceChoices, rows: RowChoices) => void;
  services: ServiceChoices;
  onServicesChange: (next: ServiceChoices) => void;
  rows: RowChoices;
  onRowsChange: (next: RowChoices) => void;
  clearChoices: ClearChoices;
  disabled: boolean;
}) {
  const endpointTypes = useGetEndpointTypes().data;
  const serviceTypes = useGetServiceTypes().data;
  // A choice made under an older version, or for another slot declaration, may not fit the slot any more: it is cleared (with its service and rows).
  const misfit = slots.filter((s) => {
    const chosen = endpoints?.find((e) => e.endpoint_id === value[s.key]);
    return !!chosen && !typeFits(s.endpoint_types, chosen.type_id);
  }).map((s) => s.key);
  const misfitKey = misfit.join("\n");
  useEffect(() => {
    if (misfit.length === 0) return;
    clearChoices(misfit, "choice");
  }, [misfitKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (loading) return <LoadingState label="Loading the device's endpoints..." className="p-2" />;
  if (error) return <InlineAlert>Could not load the device's endpoints: {error}</InlineAlert>;
  if (endpoints && endpoints.length === 0) {
    return <InlineAlert variant="warning">This template uses endpoints, but the device has none. Add them on the device's Assets tab.</InlineAlert>;
  }
  const optionsFor = (slot: InputEndpoint) => (endpoints ?? []).filter((e) => typeFits(slot.endpoint_types, e.type_id)).map((e) => ({
    value: e.endpoint_id,
    label: e.ip ? `${e.name ?? e.type_label} (${e.ip})` : (e.name ?? e.type_label),
    hint: e.type_label,
  }));
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {slots.map((s) => {
        const options = optionsFor(s);
        if (options.length === 0 && s.endpoint_types?.length) {
          return (
            <div key={s.key} className="space-y-1">
              <Label>Endpoint: {s.slot}</Label>
              <p className="text-xs text-red-700">This device has no endpoint of type {typeLabels(s.endpoint_types, endpointTypes)}</p>
            </div>
          );
        }
        return (
        <div key={s.key} className="space-y-1">
          <Label htmlFor={`cfg-endpoint-${s.key}`}>Endpoint: {s.slot}</Label>
          <SearchableSelect
            id={`cfg-endpoint-${s.key}`}
            disabled={disabled}
            value={value[s.key] ?? null}
            options={options}
            placeholder="Select an endpoint"
            searchPlaceholder="Search endpoints"
            emptyText="No endpoint found."
            onChange={(v) => {
              if (v === value[s.key]) return;
              // The chosen service and rows belong to the previous endpoint.
              onChange({ ...value, [s.key]: v }, without(services, s.key), without(rows, s.key));
            }}
          />
          {s.fields.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Fills {s.fields.map((f) => <code key={f} className="mr-1 rounded bg-muted px-1">{f}</code>)}
            </p>
          )}
          {needsService(s) && (
            <ServiceSelect deviceId={deviceId} slot={s} serviceTypes={serviceTypes} endpointId={value[s.key]} value={services[s.key]}
                           onChange={(v) => onServicesChange({ ...services, [s.key]: v })} onStale={() => clearChoices([s.key], "service")} disabled={disabled} />
          )}
          {Object.entries(s.row_fields ?? {}).map(([field, subs]) => (
            <RowSelect key={field} slot={s} field={field} subs={subs} endpoint={endpoints?.find((e) => e.endpoint_id === value[s.key])}
                       value={rows[s.key]?.[field]} onChange={(rowId) => onRowsChange(withRow(rows, s.key, field, rowId))} disabled={disabled} />
          ))}
        </div>
        );
      })}
    </div>
  );
}

/** The service of the chosen endpoint that fills a slot's `${service[slot].*}` placeholders; never preselected. */
function ServiceSelect({ deviceId, slot, serviceTypes, endpointId, value, onChange, onStale, disabled }: {
  deviceId: string;
  slot: InputEndpoint;
  serviceTypes?: { type_id: string; label: string }[];
  endpointId?: string;
  value?: string;
  onChange: (serviceId: string) => void;
  /** the stored service no longer exists: clear it */
  onStale: () => void;
  disabled: boolean;
}) {
  const services = useEndpointServices(deviceId, endpointId);
  const fitting = (services.data ?? []).filter((s) => typeFits(slot.service_types, s.type_id));
  const noneFit = !!services.data && services.data.length > 0 && fitting.length === 0 && !!slot.service_types?.length;
  const options = fitting.map((s) => {
    const name = s.name ?? s.type_label;
    return { value: s.service_id, label: s.port != null && s.port !== "" ? `${name} (${String(s.port)})` : name, hint: s.type_label };
  });
  // a stored service that no longer exists (deleted since the revision) is cleared
  const stale = !!value && !!services.data && !options.some((o) => o.value === value);
  useEffect(() => {
    if (stale) onStale();
  }, [stale]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-1 pt-1">
      <Label htmlFor={`cfg-service-${slot.key}`}>Service: {slot.slot}</Label>
      {noneFit ? (
        <p className="text-xs text-red-700">This endpoint has no service of type {typeLabels(slot.service_types!, serviceTypes)}</p>
      ) : (
      <SearchableSelect
        id={`cfg-service-${slot.key}`}
        disabled={disabled || !endpointId}
        value={stale ? null : value ?? null}
        options={options}
        placeholder={endpointId ? "Select a service" : "Select an endpoint first"}
        searchPlaceholder="Search services"
        emptyText="No service found."
        onChange={onChange}
      />
      )}
      {services.isError && <p className="text-xs text-red-700">Could not load the endpoint's services: {getErrorMessage(services.error)}</p>}
      {services.data?.length === 0 && <p className="text-xs text-red-700">This endpoint has no services: add one on the device's Assets tab.</p>}
      {(!value || stale) && !noneFit && <p className="text-xs text-red-700">Choose a service</p>}
      <p className="text-xs text-muted-foreground">
        Fills {slot.service_fields!.map((f) => <code key={f} className="mr-1 rounded bg-muted px-1">{f}</code>)}
      </p>
    </div>
  );
}

/** The row of the chosen endpoint's list field that fills a slot's `${endpoint[slot].<field>.<sub>}` placeholders:
 * the only row is used without asking; of several, none is preselected. */
function RowSelect({ slot, field, subs, endpoint, value, onChange, disabled }: {
  slot: InputEndpoint;
  field: string;
  /** the sub-fields the template reads */
  subs: string[];
  /** the chosen endpoint, once loaded */
  endpoint?: DeviceEndpoint;
  value?: string;
  onChange: (rowId: string | undefined) => void;
  disabled: boolean;
}) {
  const options = rowsOf(endpoint, field).flatMap((row, i) => (typeof row.id === "string" ? [{
    value: row.id,
    label: `${i + 1}: ${subs.map((sub) => `${sub} ${row[sub] == null ? "—" : String(row[sub])}`).join(" · ")}`,
  }] : []));
  // The only row is used; a stored row that no longer exists (deleted since the revision) is cleared.
  const wanted = !endpoint ? value : options.length === 1 ? options[0].value : options.some((o) => o.value === value) ? value : undefined;
  // onChange is new on every render: a choice lost to a sibling's update in the same tick is set again.
  useEffect(() => {
    if (wanted !== value) onChange(wanted);
  }, [wanted, value, onChange]);
  const id = `cfg-row-${slot.key}-${field}`;
  const asks = !endpoint || options.length > 1;
  return (
    <div className="space-y-1 pt-1">
      <Label htmlFor={asks ? id : undefined}>{field}: {slot.slot}</Label>
      {asks ? (
        <SearchableSelect
          id={id}
          disabled={disabled || !endpoint}
          value={wanted ?? null}
          options={options}
          placeholder={endpoint ? "Choose a row" : "Select an endpoint first"}
          searchPlaceholder="Search rows"
          emptyText="No row found."
          onChange={onChange}
        />
      ) : options.length === 1 ? (
        <p className="text-xs text-muted-foreground">Uses the only {field} row</p>
      ) : (
        <p className="text-xs text-red-700">This endpoint has no {field} rows</p>
      )}
      {endpoint && options.length > 1 && !wanted && <p className="text-xs text-red-700">Choose a row</p>}
      <p className="text-xs text-muted-foreground">
        Fills {subs.map((sub) => <code key={sub} className="mr-1 rounded bg-muted px-1">{field}.{sub}</code>)}
      </p>
    </div>
  );
}
