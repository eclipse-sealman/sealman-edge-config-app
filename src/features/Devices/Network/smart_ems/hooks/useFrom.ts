import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { clearUrlParams } from "../services/smartems/auth/helpers";

export function useFrom() {
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from");

  const [from, setFrom] = useState<string | null>(() => {
    if (fromParam) {
      sessionStorage.setItem("from", fromParam);
      clearUrlParams();
      return fromParam;
    }
    return sessionStorage.getItem("from");
  });

  const resetFrom = () => {
    sessionStorage.removeItem("from");
    setFrom(null);
  };

  const clearFrom = () => {
    sessionStorage.removeItem("from");
  };

  return { from, resetFrom, clearFrom };
}
