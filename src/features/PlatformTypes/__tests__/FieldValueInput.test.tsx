import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FieldValueInput, { formatMetadataValue, validateFieldValue, validateFields } from "../FieldValueInput";
import type { FieldDefinition } from "../FieldsEditor";

const column: FieldDefinition = {
  type: "string", label: "Identifier", required: true, ui: "input", changeable: true, show_in_list: true,
};
const quantity: FieldDefinition = {
  ...column, type: "integer", label: "Quantity", ui: "number", required: false, default: 1,
  validation: { minimum: 0, exclusive_minimum: false, exclusive_maximum: false },
};
const equipment: FieldDefinition = {
  type: "list", label: "Equipment", required: true, changeable: true, show_in_list: true,
  item_fields: { identifier: column, quantity },
  item_order: ["quantity", "identifier"],
};

describe("list field values", () => {
  it("requires a nonempty array of objects and validates row fields and IDs", () => {
    expect(validateFields({ equipment: [] }, { equipment })).toBe('"Equipment" is required');
    expect(validateFieldValue("Equipment", [{}], equipment)).toContain('row 1: "Identifier" is required');
    expect(validateFieldValue("Equipment", [{ identifier: "A", quantity: -1 }], equipment)).toContain('"Quantity" must be at least 0');
    expect(validateFieldValue("Equipment", [{ identifier: "A", quantity: 1.5 }], equipment)).toContain('"Quantity" must be an integer');
    for (const value of ["", "legacy", [null], [[]], [3]]) {
      expect(validateFieldValue("Equipment", value, equipment)).toBe('"Equipment" must be a list of rows');
      expect(validateFields({ equipment: value }, { equipment: { ...equipment, required: false } }))
        .toBe('"Equipment" must be a list of rows');
    }
    expect(validateFieldValue("Equipment", [{ id: 1, identifier: "A" }], equipment)).toContain("invalid or duplicate row ID");
    expect(validateFieldValue("Equipment", [{ id: "a", identifier: "A" }, { id: "a", identifier: "B" }], equipment)).toContain("invalid or duplicate row ID");
    expect(validateFieldValue("Equipment", [{ identifier: "A", extra: { arbitrary: [1] } }], equipment)).toBeNull();
    expect(validateFields({ equipment: [] }, { equipment: { ...equipment, required: false } })).toBeNull();
    expect(validateFieldValue("Equipment", [{}], {
      ...equipment, item_fields: { identifier: { ...column, default: "A" } },
    })).toContain("is required");
  });

  it("formats labeled rows in response order, retaining false and zero and appending unordered columns", () => {
    const definition: FieldDefinition = {
      ...equipment,
      item_order: ["quantity", "stale", "quantity"],
      item_fields: { ...equipment.item_fields, enabled: { ...column, type: "boolean", label: "Enabled", ui: "toggle" } },
    };
    expect(formatMetadataValue([
      { id: "hidden", identifier: "A", quantity: 0, enabled: false },
      { identifier: "B", quantity: 2, enabled: true },
    ], definition)).toBe("Quantity: 0, Identifier: A, Enabled: No; Quantity: 2, Identifier: B, Enabled: Yes");
    expect(formatMetadataValue([], definition)).toBe("");
    expect(formatMetadataValue("legacy", definition)).toContain("Invalid list value");
  });

  it("edits and removes whole rows, preserves server IDs and unknown data, and initializes new rows without IDs", async () => {
    const existing = { id: "server-id", identifier: "A", quantity: 2, extra: { nested: ["keep"] } };
    let latest: unknown;
    function Harness() {
      const [value, setValue] = useState<unknown>([existing]);
      return <FieldValueInput definition={equipment} value={value} onChange={(next) => {
        latest = next;
        setValue(next);
      }} />;
    }
    render(<Harness />);
    const identifier = screen.getByRole("textbox", { name: "Identifier, row 1" });
    await userEvent.clear(identifier);
    await userEvent.type(identifier, "Updated");
    expect(latest).toEqual([{ ...existing, identifier: "Updated" }]);
    await userEvent.click(screen.getByRole("button", { name: "Add row" }));
    expect(latest).toEqual([{ ...existing, identifier: "Updated" }, { quantity: 1, identifier: null }]);
    await userEvent.click(screen.getByRole("button", { name: "Remove row 1" }));
    expect(latest).toEqual([{ quantity: 1, identifier: null }]);
    await userEvent.click(screen.getByRole("button", { name: "Remove row 1" }));
    expect(latest).toEqual([]);
  });

  it("requires explicit replacement of legacy values and disables all mutations when disabled", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<FieldValueInput definition={equipment} value="legacy" onChange={onChange} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Stored value is not a list of rows");
    expect(screen.queryByRole("button", { name: "Add row" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Replace with empty list" }));
    expect(onChange).toHaveBeenCalledWith([]);
    rerender(<FieldValueInput definition={equipment} value={[{ identifier: "A" }]} onChange={onChange} disabled />);
    expect(screen.getByRole("textbox", { name: "Identifier, row 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add row" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove row 1" })).toBeDisabled();
  });
});
