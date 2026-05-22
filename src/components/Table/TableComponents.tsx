import React, {
  DetailedHTMLProps,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
} from "react";

export function Table({
  children,
  className,
  ...props
}: DetailedHTMLProps<TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>) {
  return (
    <table
      className={`relative w-full rounded-sm ${className || ""}`}
      {...props}
    >
      {children}
    </table>
  );
}

export function TR({
  children,
  className,
  ...props
}: DetailedHTMLProps<
  HTMLAttributes<HTMLTableRowElement>,
  HTMLTableRowElement
>) {
  return (
    <tr className={`even:bg-slate-50 ${className || ""}`} {...props}>
      {children}
    </tr>
  );
}

export function THead({
  children,
  className,
  ...props
}: DetailedHTMLProps<
  HTMLAttributes<HTMLTableSectionElement>,
  HTMLTableSectionElement
>) {
  return (
    <thead
      className={`sticky top-0 bg-vibrant-blue text-left text-white ${
        className || ""
      }`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TBody({
  children,
  className,
  ...props
}: DetailedHTMLProps<
  React.HTMLAttributes<HTMLTableSectionElement>,
  HTMLTableSectionElement
>) {
  return (
    <tbody
      className={`divide-y divide-solid bg-white ${className || ""}`}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TD({
  children,
  className,
  ...props
}: DetailedHTMLProps<
  TdHTMLAttributes<HTMLTableCellElement>,
  HTMLTableCellElement
>) {
  return (
    <td className={`p-2 ${className || ""}`} {...props}>
      {children}
    </td>
  );
}

export function TH({
  children,
  className,
  ...props
}: DetailedHTMLProps<
  React.ThHTMLAttributes<HTMLTableCellElement>,
  HTMLTableCellElement
>) {
  return (
    <th className={`p-2 ${className || ""}`} {...props}>
      {children}
    </th>
  );
}
