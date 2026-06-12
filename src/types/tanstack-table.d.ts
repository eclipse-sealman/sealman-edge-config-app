import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    // Shared presentation metadata for table columns. Components can read this
    // to apply consistent alignment or other display-only behavior without
    // hard-coding column IDs in each table view.
    align?: "left" | "center" | "right";
  }
}