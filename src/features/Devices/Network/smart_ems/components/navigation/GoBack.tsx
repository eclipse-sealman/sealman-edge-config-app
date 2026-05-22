import { Link } from "react-router-dom";
import { useFrom } from "../../hooks/useFrom";

export function GoBack() {
  const { from, clearFrom } = useFrom();

  if (!from) return null;

  return (
  <Link
    to={from}
    onClick={clearFrom}
    className="
      inline-flex items-center gap-2
      rounded-full border
      bg-muted/40
      px-4 py-2
      text-sm font-medium
      text-muted-foreground
      hover:bg-muted
      hover:text-foreground
      transition
    "
  >
    <span className="text-base">←</span>
    <span>Back</span>
  </Link>
);
}
