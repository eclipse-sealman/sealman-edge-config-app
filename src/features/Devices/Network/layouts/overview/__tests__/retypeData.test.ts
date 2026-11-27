import { describe, expect, it } from "vitest";
import type { components } from "@/generated/edge-administration/types";
import { initialRetypeValues, retypePatchValues, validateRetypeValues } from "../retypeData";

type FieldDefinition = components["schemas"]["FieldDefinition"];

function field(label: string, extra: Partial<FieldDefinition> = {}): FieldDefinition {
  return { type: "string", label, required: false, ui: "input", default: null, changeable: true, show_in_list: true, ...extra };
}

describe("initialRetypeValues", () => {
  it("pre-fills matching keys with the stored value, even over a default", () => {
    const values = initialRetypeValues(
      { serial: field("Serial", { default: "UNKNOWN" }), location: field("Location") },
      { serial: { value: "S-1", field: null }, note: { value: "keep", field: null } },
    );
    expect(values).toEqual({ serial: "S-1", location: null });
  });

  it("uses the field default when there is no stored value", () => {
    expect(initialRetypeValues({ serial: field("Serial", { default: "UNKNOWN" }) }, {})).toEqual({ serial: "UNKNOWN" });
  });

  it("preserves explicit null, false, zero and empty strings instead of applying defaults", () => {
    const fields = {
      serial: field("Serial", { default: "UNKNOWN" }),
      enabled: field("Enabled", { type: "boolean", default: true }),
      quantity: field("Quantity", { type: "integer", default: 10 }),
      note: field("Note", { default: "default note" }),
    };
    const values = initialRetypeValues(fields, {
      serial: { value: null, field: fields.serial },
      enabled: { value: false, field: fields.enabled },
      quantity: { value: 0, field: fields.quantity },
      note: { value: "", field: fields.note },
    });
    expect(values).toEqual({ serial: null, enabled: false, quantity: 0, note: "" });
    expect(initialRetypeValues(fields, {}, false)).toEqual({ serial: null, enabled: null, quantity: null, note: null });
  });
});

describe("retypePatchValues", () => {
  it("omits untouched empty controls but sends explicit clears, false and zero", () => {
    expect(retypePatchValues(
      { cleared: null, blank: "", untouched: null, empty: "", absent: undefined, value: "x", zero: 0, enabled: false },
      new Set(["cleared", "blank"]),
    )).toEqual({ cleared: null, blank: "", value: "x", zero: 0, enabled: false });
  });
});

describe("validateRetypeValues", () => {
  it("defers ambiguous untouched null/default validation to the API but rejects explicit required clears", () => {
    const fields = { serial: field("Serial", { required: true, default: "UNKNOWN" }) };
    expect(validateRetypeValues({ serial: null }, fields, new Set())).toBeNull();
    expect(validateRetypeValues({ serial: null }, fields, new Set(["serial"]))).toContain("required");
  });

  it("allows missing cell defaults on retype without changing row data, never replacing explicit null", () => {
    const equipment: FieldDefinition = {
      ...field("Equipment"), type: "list", ui: null,
      item_fields: { serial: field("Serial", { required: true, default: "UNKNOWN" }) },
    };
    const values = { equipment: [{ id: "stored", legacy: { nested: [1] } }] };
    expect(validateRetypeValues(values, { equipment }, new Set())).toBeNull();
    expect(values.equipment).toEqual([{ id: "stored", legacy: { nested: [1] } }]);
    expect(initialRetypeValues({ equipment }, { equipment: { value: values.equipment, field: equipment } }).equipment)
      .toEqual(values.equipment);
    expect(validateRetypeValues({ equipment: [{ id: "stored", serial: null }] }, { equipment }, new Set())).toContain("required");
  });
});
