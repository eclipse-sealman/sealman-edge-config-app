import { useState } from "react";
import { InlineAlert } from "@/components/ui/page-state";
import { getErrorMessage } from "@/lib/errors";
import {
  useBlocks, useDeviceEndpoints, type Copy, type EndpointChoices, type Finding, type InputEndpoint, type InputVariable, type RowChoices,
  type ServiceChoices, type TemplateVersion, type Values,
} from "@/features/ModuleConfigTemplates/api";
import { InputsSection, needsService, withoutKeys, type ClearChoices, rowsChosen as allRowsChosen } from "./ConfigInputs";
import { ListEntries, cardsValid, entriesToPayload, splitRevisionValues, type ListCards, type ListEntryRef } from "./ListEntries";

/** What the form needs of a template: a saved version, or the server's view of an unsaved body (lint). */
export type TemplateInputsSource = Pick<TemplateVersion, "variables" | "references" | "inputs">;

interface CopyGroup {
  copy: Copy;
  title: string;
  variables: InputVariable[];
  slots: InputEndpoint[];
}

/** What the form asks for: the top-level inputs, then one group per top-level block copy (nested copies join their ancestor's). */
function inputsOf(version?: TemplateInputsSource) {
  const inputs = version?.inputs;
  if (!version) return { topVariables: [] as InputVariable[], topSlots: [] as InputEndpoint[], groups: [] as CopyGroup[], slots: [] as InputEndpoint[] };
  if (!inputs) {
    // No block copies: the template's own variables and endpoint slots (`<list>.<sub>` reads a row, not a field).
    const used = version.references.endpoint_fields ?? [];
    const topSlots = (version.references.endpoints ?? []).map((slot) => ({
      key: slot, slot, copy: null,
      fields: used.filter((f) => f.startsWith(`${slot}.`)).map((f) => f.slice(slot.length + 1)).filter((f) => !f.includes(".")),
    }));
    return { topVariables: version.variables.map((v) => ({ ...v, key: v.name })), topSlots, groups: [], slots: topSlots };
  }
  const byKey = new Map(inputs.copies.map((c) => [c.key, c]));
  const topOf = (key: string | null | undefined): string | null => {
    let c = key ? byKey.get(key) : undefined;
    while (c?.parent && byKey.has(c.parent)) c = byKey.get(c.parent);
    return c?.key ?? null;
  };
  const groups = inputs.copies.filter((c) => !c.parent).map((copy) => ({
    copy,
    title: `${copy.key.replaceAll("/", " · ")} · ${copy.name ?? ""}`,
    variables: inputs.variables.filter((v) => topOf(v.copy) === copy.key),
    slots: inputs.endpoints.filter((e) => topOf(e.copy) === copy.key),
  }));
  return {
    topVariables: inputs.variables.filter((v) => !v.copy),
    topSlots: inputs.endpoints.filter((e) => !e.copy),
    groups,
    slots: inputs.endpoints,
  };
}

/**
 * The state of the inputs form for a template on a device: values, endpoint, service and row choices, list cards, and the
 * payload (`sent`) for render/preview/apply. `stored` starts it from a revision's values ("$endpoints", "$services", "$rows", "$lists").
 */
export function useTemplateInputs(deviceId: string | undefined, source: TemplateInputsSource | undefined, groupId: number | null | undefined, stored?: Values, applied?: { module: string; templateId: number }) {
  const [initial] = useState(() => splitRevisionValues(stored ?? {}));
  const [values, setValues] = useState<Values>(initial.values);
  const [endpoints, setEndpoints] = useState<EndpointChoices>(initial.endpoints);
  const [services, setServices] = useState<ServiceChoices>(initial.services);
  const [rows, setRows] = useState<RowChoices>(initial.rows);
  const [cards, setCards] = useState<ListCards>(initial.cards);

  const { topVariables, topSlots, groups: copyGroups, slots } = inputsOf(source);
  const lists = source?.inputs?.lists ?? [];
  const deviceMeta = [...new Set([...(source?.references.device ?? []), ...lists.flatMap((l) => l.blocks.flatMap((b) => b.inputs.device))])];
  const listSlots = lists.some((l) => l.blocks.some((b) => b.inputs.endpoints.length > 0));
  const deviceEndpoints = useDeviceEndpoints(deviceId ?? "", !!deviceId && (slots.length > 0 || listSlots));
  // Archived blocks stay in the template's lists but are not offered for new entries.
  const blocks = useBlocks(lists.length > 0 ? groupId ?? null : null);
  const activeBlockIds = blocks.data && new Set(blocks.data.filter((b) => !b.archived).map((b) => b.id));
  const listsValid = lists.every((l) => cardsValid(l, cards[l.key] ?? []));
  // A slot that reads a service needs one chosen (the server would say `missing-service`).
  const servicesChosen = slots.every((s) => !needsService(s) || services[s.key]);
  // A slot that reads rows of a list field needs one chosen for each (the server would say so if there are several).
  const rowsChosen = allRowsChosen(slots, rows);
  // Stored entries of lists the template no longer has: not applied, so say so.
  const dropped = source ? Object.entries(cards).filter(([key, c]) => c.length > 0 && !lists.some((l) => l.key === key)) : [];

  // Entries go in "lists"; their values, endpoint, service and row choices join the top-level ones under prefixed keys.
  const parts = lists.map((l) => entriesToPayload(l, cards[l.key] ?? []));
  const allEndpoints: EndpointChoices = Object.assign({ ...endpoints }, ...parts.map((p) => p.endpoints));
  const allServices: ServiceChoices = Object.assign({ ...services }, ...parts.map((p) => p.services));
  const allRows: RowChoices = Object.assign({ ...rows }, ...parts.map((p) => p.rows));
  const sent = {
    values: Object.assign({ ...values }, ...parts.map((p) => p.values)) as Values,
    ...(Object.keys(allEndpoints).length > 0 && { endpoints: allEndpoints }),
    ...(Object.keys(allServices).length > 0 && { services: allServices }),
    ...(Object.keys(allRows).length > 0 && { rows: allRows }),
    ...(lists.length > 0 && { lists: Object.assign({}, ...parts.map((p) => p.lists)) as Record<string, ListEntryRef[]> }),
  };

  // Files chosen for a file variable belong to the device and module: only an apply form has them.
  const fileScope = deviceId && applied ? { device: deviceId, ...applied } : undefined;

  const reset = () => { setValues({}); setEndpoints({}); setServices({}); setRows({}); setCards({}); };

  return {
    deviceId: deviceId ?? "", fileScope, sent, listsValid, servicesChosen, rowsChosen, reset,
    values, setValues, endpoints, setEndpoints, services, setServices, rows, setRows, cards, setCards,
    topVariables, topSlots, copyGroups, lists, deviceMeta, dropped, activeBlockIds, deviceEndpoints,
  };
}

export type TemplateInputsState = ReturnType<typeof useTemplateInputs>;

/** The inputs form: top-level inputs, one box per block copy, list cards, and the device metadata used. */
export function TemplateInputs({ form, findings, blocked }: { form: TemplateInputsState; findings: Finding[]; blocked: boolean }) {
  const { deviceEndpoints } = form;
  // Sections share the state and may clear in the same commit: each clear filters the latest state.
  const clearChoices: ClearChoices = (keys, scope) => {
    form.setServices((all) => withoutKeys(all, keys));
    if (scope === "choice") { form.setEndpoints((all) => withoutKeys(all, keys)); form.setRows((all) => withoutKeys(all, keys)); }
  };
  const sectionProps = {
    deviceId: form.deviceId, fileScope: form.fileScope, values: form.values, setValues: form.setValues, endpoints: form.endpoints, services: form.services,
    setServices: form.setServices, rows: form.rows, setRows: form.setRows, findings, blocked,
    setEndpoints: (nextEndpoints: EndpointChoices, nextServices: ServiceChoices, nextRows: RowChoices) => {
      form.setEndpoints(nextEndpoints); form.setServices(nextServices); form.setRows(nextRows);
    },
    clearChoices,
    deviceEndpoints: deviceEndpoints.data, endpointsLoading: deviceEndpoints.isLoading,
    endpointsError: deviceEndpoints.isError ? getErrorMessage(deviceEndpoints.error) : undefined,
  };
  return (
    <>
      <InputsSection variables={form.topVariables} slots={form.topSlots} {...sectionProps} />
      {form.copyGroups.map((g) => (
        <fieldset key={g.copy.key} aria-label={g.title} className="space-y-3 rounded-md border p-3">
          <legend className="px-1 text-sm font-medium">{g.title}</legend>
          <InputsSection variables={g.variables} slots={g.slots} {...sectionProps} />
        </fieldset>
      ))}
      {form.dropped.map(([key, c]) => (
        <InlineAlert key={key} variant="warning">
          This template no longer has the list '{key}': entries {c.map((e) => e.name).join(", ")} will not be applied.
        </InlineAlert>
      ))}
      {form.lists.map((list) => (
        <ListEntries key={list.key} deviceId={form.deviceId} fileScope={form.fileScope} list={list} cards={form.cards[list.key] ?? []} activeBlockIds={form.activeBlockIds}
                     onChange={(next) => form.setCards((all) => ({ ...all, [list.key]: next(all[list.key] ?? []) }))} findings={findings} blocked={blocked}
                     deviceEndpoints={sectionProps.deviceEndpoints} endpointsLoading={sectionProps.endpointsLoading}
                     endpointsError={sectionProps.endpointsError} />
      ))}
      {form.deviceMeta.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Also uses the device's metadata: {form.deviceMeta.map((d) => <code key={d} className="mr-1 rounded bg-muted px-1">{d}</code>)}
        </p>
      )}
    </>
  );
}
