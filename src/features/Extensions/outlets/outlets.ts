export type OutletTarget = "global" | "device" | "endpoint" | "module";
export type OutletPlacement = "section" | "field-row" | "tab" | "page" | "replace:config" | "replace:page";

/** The outlets this app version renders. Contributions for any other pair are ignored. */
export const SUPPORTED_OUTLETS: ReadonlyArray<{ target: OutletTarget; placement: OutletPlacement }> = [
  { target: "global", placement: "section" },
  { target: "global", placement: "page" },
  { target: "device", placement: "tab" },
  { target: "endpoint", placement: "section" },
  // end of every row of every list field on the endpoint details page
  { target: "endpoint", placement: "field-row" },
  // appends a tab to the module page's tab bar
  { target: "module", placement: "tab" },
  // replaces the Configuration tab of the module page
  { target: "module", placement: "replace:config" },
  // replaces everything of the module page below its header: the tab bar and all tabs
  { target: "module", placement: "replace:page" },
];

export function isSupportedOutlet(target: string, placement: string): boolean {
  return SUPPORTED_OUTLETS.some((o) => o.target === target && o.placement === placement);
}
