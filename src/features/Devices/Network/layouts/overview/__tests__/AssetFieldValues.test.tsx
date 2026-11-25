import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import type { components } from "@/generated/edge-administration/types";
import AssetFieldValues from "../AssetFieldValues";

type FieldDefinition = components["schemas"]["FieldDefinition"];
const scalar = { type: "string", label: "Identifier", required: false, changeable: true, show_in_list: true } as const;
const equipment: FieldDefinition = {
  type: "list", label: "Equipment", required: false, changeable: true, show_in_list: true,
  item_order: ["quantity", "identifier", "enabled"],
  item_fields: {
    identifier: { ...scalar, required: true, default: "New identifier", changeable: false },
    quantity: { ...scalar, type: "integer", label: "Quantity", default: 2 },
    enabled: { ...scalar, type: "boolean", label: "Enabled", default: false },
  },
};

it("displays list columns in API item_order, preserves false and zero, and hides internal row IDs", () => {
  render(<AssetFieldValues fields={{
    equipment: {
      type: "list", label: "Equipment", required: false, changeable: true, show_in_list: true,
      item_order: ["quantity", "enabled", "identifier"],
      item_fields: {
        identifier: { type: "string", label: "Identifier", required: false, changeable: true, show_in_list: true },
        enabled: { type: "boolean", label: "Enabled", required: false, changeable: true, show_in_list: true },
        quantity: { type: "integer", label: "Quantity", required: false, changeable: true, show_in_list: true },
      },
    },
  }} values={{
    equipment: [{ id: "server-row-uuid", identifier: "SEP-00412", quantity: 0, enabled: false }],
    extra: { custom: "value" },
  }} />);
  const table = screen.getByRole("table");
  expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["Quantity", "Enabled", "Identifier"]);
  expect(within(table).getByRole("cell", { name: "0" })).toBeInTheDocument();
  expect(within(table).getByRole("cell", { name: "No" })).toBeInTheDocument();
  expect(within(table).getByRole("cell", { name: "SEP-00412" })).toBeInTheDocument();
  expect(screen.queryByText("server-row-uuid")).not.toBeInTheDocument();
  expect(screen.getByText('{"custom":"value"}')).toBeInTheDocument();
});

it("keeps the same field grid, table, column order, and rows when Edit replaces values with controls", () => {
  const fields = { name: { ...scalar, label: "Name" }, equipment };
  const values = {
    name: "Line A", note: "Custom note",
    equipment: [{ id: "server-id", identifier: "A", quantity: 0, enabled: false }],
  };
  const { rerender } = render(<AssetFieldValues fields={fields} values={values} />);
  const nameField = screen.getByText("Line A").closest("dd")!.parentElement;
  const customField = screen.getByText("Custom note").closest("dd")!.parentElement;
  const table = screen.getByRole("table", { name: "Equipment" });
  const row = table.querySelector("tbody tr");
  const cells = [...row!.children];
  const grid = table.closest("dl");
  expect(screen.queryByRole("button", { name: "Add row" })).not.toBeInTheDocument();

  rerender(<AssetFieldValues fields={fields} values={values} onChange={vi.fn()} onDelete={vi.fn()} />);
  expect(screen.getByRole("textbox", { name: "Name" }).closest("dd")!.parentElement).toBe(nameField);
  expect(screen.getByRole("textbox", { name: "note" }).closest("dd")!.parentElement).toBe(customField);
  expect(screen.getByRole("table", { name: "Equipment" })).toBe(table);
  expect(table.closest("dl")).toBe(grid);
  expect(table.querySelector("tbody tr")).toBe(row);
  [...row!.children].forEach((cell, index) => expect(cell).toBe(cells[index]));
  expect(screen.getByText("Line A")).toHaveAttribute("aria-hidden", "true");
  expect(within(table).getAllByRole("columnheader").map(cell => cell.textContent))
    .toEqual(["Quantity", "Identifier *", "Enabled", ""]);
  expect(screen.getByRole("spinbutton", { name: "Quantity, row 1" })).toHaveValue(0);
  expect(screen.getByRole("textbox", { name: "Identifier, row 1" })).toBeEnabled();

  rerender(<AssetFieldValues fields={fields} values={values} />);
  expect(screen.getByRole("table", { name: "Equipment" })).toBe(table);
  expect(screen.getByText("Custom note").closest("dd")!.parentElement).toBe(customField);
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});

it("edits table rows without losing IDs or unknown data and adds defaults without client IDs", async () => {
  const original = { id: "server-id", identifier: "A", quantity: 0, enabled: false, extra: { nested: ["keep"] } };
  let latest: unknown;
  function Harness() {
    const [values, setValues] = useState<Record<string, unknown>>({ equipment: [original] });
    return <AssetFieldValues fields={{ equipment }} values={values} onChange={(key, value) => {
      latest = value;
      setValues(current => ({ ...current, [key]: value }));
    }} />;
  }
  render(<Harness />);
  const input = screen.getByRole("textbox", { name: "Identifier, row 1" });
  await userEvent.clear(input);
  await userEvent.type(input, "Updated");
  expect(latest).toEqual([{ ...original, identifier: "Updated" }]);
  await userEvent.click(screen.getByRole("button", { name: "Add row" }));
  expect(latest).toEqual([
    { ...original, identifier: "Updated" },
    { quantity: 2, identifier: "New identifier", enabled: false },
  ]);
  await userEvent.click(screen.getByRole("button", { name: "Remove row 1" }));
  expect(latest).toEqual([{ quantity: 2, identifier: "New identifier", enabled: false }]);
});

it("groups ordinary and custom fields before lists and keeps row actions in the list header rather than a footer", () => {
  const fields = { equipment, name: { ...scalar, label: "Name" } };
  const values = { equipment: [{ identifier: "A" }], note: "Custom note", name: "Line A" };
  const { rerender } = render(<AssetFieldValues fields={fields} values={values} />);
  const table = screen.getByRole("table", { name: "Equipment" });
  const grid = table.closest("dl")!;
  const labels = () => [...grid.children].map(field => field.querySelector("dt")!.textContent!.trim());
  expect(labels()).toEqual(["Name", "note", "Equipment"]);
  expect(table.parentElement!.parentElement!.tagName).toBe("DD");
  expect(table.parentElement!.parentElement!.children).toHaveLength(1);

  rerender(<AssetFieldValues fields={fields} values={values} onChange={vi.fn()} onDelete={vi.fn()} />);
  const addRow = screen.getByRole("button", { name: "Add row" });
  expect(addRow.closest("dt")!.parentElement).toBe(table.closest("dd")!.parentElement);
  expect([...grid.children].slice(0, 2).map(field => field.querySelector("dt")!.textContent!.trim()))
    .toEqual(["Name", "note"]);
  expect(table.parentElement!.parentElement!.children).toHaveLength(1);
});

it("retains saved-field locks, disables changes while saving, and requires explicit legacy list replacement", async () => {
  const onChange = vi.fn();
  const fields = { serial: { ...scalar, label: "Serial", changeable: false }, equipment };
  const { rerender } = render(<AssetFieldValues fields={fields}
    values={{ serial: "SN-1", equipment: [{ identifier: "A" }] }} onChange={onChange} onDelete={vi.fn()} disabled />);
  expect(screen.getByRole("textbox", { name: "Serial" })).toBeDisabled();
  expect(screen.getByRole("textbox", { name: "Identifier, row 1" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Add row" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Remove row 1" })).toBeDisabled();
  rerender(<AssetFieldValues fields={fields} values={{ serial: "SN-1", equipment: "legacy" }} onChange={onChange} onDelete={vi.fn()} />);
  expect(screen.getByRole("textbox", { name: "Serial" })).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent("Stored value is not a list of rows");
  await userEvent.click(screen.getByRole("button", { name: "Replace with empty list" }));
  expect(onChange).toHaveBeenCalledWith("equipment", []);
});

it("creates custom fields immediately beside their editor, before list tables, without relocating the editor", async () => {
  function Harness() {
    const [values, setValues] = useState<Record<string, unknown>>({
      name: "Line A", equipment: [{ id: "server-id", identifier: "A" }],
    });
    return <AssetFieldValues fields={{ equipment, name: { ...scalar, label: "Name" } }} values={values}
      onChange={(key, value) => setValues(current => ({ ...current, [key]: value }))} onDelete={vi.fn()} />;
  }
  render(<Harness />);
  const editor = screen.getByText("Add custom field").parentElement!;
  const listField = screen.getByRole("table", { name: "Equipment" }).closest("dd")!.parentElement;
  expect(editor.nextElementSibling).toBe(listField);
  const inputs = within(editor).getAllByRole("textbox");
  await userEvent.type(inputs[0], "location");
  await userEvent.type(inputs[1], "Line B");
  await userEvent.click(within(editor).getByRole("button", { name: "Add Field" }));
  const newField = screen.getByRole("textbox", { name: "location" }).closest("dd")!.parentElement!;
  expect(newField.nextElementSibling).toBe(editor);
  expect(editor.nextElementSibling).toBe(listField);
  expect(screen.getByRole("textbox", { name: "location" })).toHaveValue("Line B");
  expect(inputs[0]).toHaveValue("");
  expect(inputs[1]).toHaveValue("");
});
