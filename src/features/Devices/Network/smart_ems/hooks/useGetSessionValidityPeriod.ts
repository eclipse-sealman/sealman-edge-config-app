import { useEffect, useState } from "react";
import { useListUserRoles } from "../services/smartems/hooks";

export function useGetSessionValidityPeriod() {
  const { data } = useListUserRoles();
  const refreshTokenExpiration = data?.refreshTokenExpiration;
  const [secondsLeft, setSecondsLeft] = useState<number | undefined>();

  useEffect(() => {
    if (!refreshTokenExpiration) {
      return;
    }

    const nowInSec = Date.now() / 1000;
    setSecondsLeft(refreshTokenExpiration - nowInSec);
  }, [refreshTokenExpiration]);

  return {
    secondsLeft,
    sessionTimeout: data?.sessionTimeout,
  };
}
