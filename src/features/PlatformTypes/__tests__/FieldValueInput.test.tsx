import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { components } from "@/generated/edge-administration/types";
import FieldValueInput, { formatMetadataValue, validateFieldValue, validateFields } from "../FieldValueInput";

type FieldDefinition = components["schemas"]["FieldDefinition"];

const equipmentField: FieldDefinition = {
  type: "list",
  label: "Equipment",
  required: true,
  ui: null,
  default: null,
  changeable: true,
  show_in_list: true,
  item_fields: {
    code: {
      type: "string",
      label: "Code",
      required: true,
      ui: "input",
      default: null,
      changeable: true,
      show_in_list: true,
    },
  },
  item_order: ["code"],
};

describe("FieldValueInput list values", () => {
  it("preserves server IDs and unknown item values while editing rows", async () => {
    const user = userEvent.setup();
    const initial = [{ id: "server-id", code: "OLD", legacy: "keep" }];
    const changed = vi.fn();
    function Harness() {
      const [value, setValue] = useState<unknown>(initial);
      return <FieldValueInput definition={equipmentField} value={value} onChange={(next) => {
        changed(next);
        setValue(next);
      }} />;
    }

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Add item" }));
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[1], "NEW");

    expect(screen.getAllByRole("textbox")[0]).toHaveValue("OLD");
    expect(screen.getAllByRole("textbox")[1]).toHaveValue("NEW");
    expect(changed).toHaveBeenLastCalledWith([...initial, { code: "NEW" }]);
    await user.click(screen.getByRole("button", { name: "Remove item 2" }));
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox")).toHaveValue("OLD");
  });

  it("validates list cardinality and required sub-fields", () => {
    expect(validateFields({ equipment: [] }, { equipment: equipmentField })).toContain('"Equipment" is required');
    expect(validateFields({ equipment: [{}] }, { equipment: equipmentField })).toContain("Code");
    expect(validateFields({ equipment: [{ code: "A-1" }] }, { equipment: equipmentField })).toBeNull();
  });

  it("formats list values compactly for metadata summaries", () => {
    expect(formatMetadataValue([{ code: "A" }, { code: "B" }], equipmentField)).toBe("2 items");
  });

  it("rejects malformed rows and duplicate or non-string server IDs, including optional empty strings", () => {
    const optional = { ...equipmentField, required: false };
    for (const value of ["", "legacy", [null], [[]], [3]]) {
      expect(validateFields({ equipment: value }, { equipment: optional })).toContain("list of objects");
    }
    expect(validateFieldValue("Equipment", [{ code: "A", id: 1 }], equipmentField)).toContain("invalid or duplicate");
    expect(validateFieldValue("Equipment", [{ code: "A", id: "same" }, { code: "B", id: "same" }], equipmentField))
      .toContain("invalid or duplicate");
    expect(validateFieldValue("Equipment", [{ code: "A", extra: { nested: [1] } }], equipmentField)).toBeNull();
  });

  it("includes defaults in new rows without generating IDs and validates required values before defaults", async () => {
    const definition: FieldDefinition = {
      ...equipmentField,
      item_fields: {
        code: { ...equipmentField.item_fields!.code, default: "DEFAULT" },
        enabled: { type: "boolean", label: "Enabled", required: true, changeable: true, show_in_list: true },
      },
    };
    expect(validateFields({ equipment: [{}] }, { equipment: definition })).toContain("Code");
    const changed = vi.fn();
    render(<FieldValueInput definition={definition} value={[]} onChange={changed} />);
    await userEvent.click(screen.getByRole("button", { name: "Add item" }));
    expect(changed).toHaveBeenCalledWith([{ code: "DEFAULT", enabled: false }]);
  });

  it("does not initialize missing or null cells in existing rows when adding a new row", async () => {
    const definition: FieldDefinition = {
      ...equipmentField,
      item_fields: { code: { ...equipmentField.item_fields!.code, default: "DEFAULT" } },
    };
    const rows = [{ id: "missing", legacy: { nested: [1] } }, { id: "null", code: null }];
    const changed = vi.fn();
    render(<FieldValueInput definition={definition} value={rows} onChange={changed} />);
    screen.getAllByRole("textbox").forEach((input) => expect(input).toHaveValue(""));
    await userEvent.click(screen.getByRole("button", { name: "Add item" }));
    expect(changed).toHaveBeenCalledWith([...rows, { code: "DEFAULT" }]);
  });

  it("requires explicit replacement of legacy data and preserves disabled controls", async () => {
    const changed = vi.fn();
    const { rerender } = render(<FieldValueInput definition={equipmentField} value="legacy" onChange={changed} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Stored value is not a list");
    expect(screen.queryByRole("button", { name: "Add item" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Replace with empty list" }));
    expect(changed).toHaveBeenCalledWith([]);
    rerender(<FieldValueInput definition={equipmentField} value={[{ code: "A" }]} onChange={changed} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add item" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove item 1" })).toBeDisabled();
  });
});