import { useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { clearAuthDataFromStorage, saveAuthorizationDataToLocalStorage } from "./local_storage";
import { authorizeWithCodeAPI, clearUrlParams, getCodeAndStateFromUrl, loginToSmartEMSWithSSO } from "./helpers";
import { useInvalidateAllSmartEmsQueries } from "../hooks";
import { logoutMicrosoftSSO } from "../api";

export const useLogout = () => {
  const invalidate = useInvalidateAllSmartEmsQueries()
  const mutation = useMutation({
    mutationFn: logoutMicrosoftSSO
  })
  const {data} = mutation

  const logoutCallback = useCallback(async () => {
    clearAuthDataFromStorage()
    await invalidate()
  }, [invalidate])

  useEffect(() => {
    if (!data) {
      return
    }

    logoutCallback()
  }, [data, logoutCallback])

  return mutation
}

export const useLogin = () => {
   return () => loginToSmartEMSWithSSO()
}

export const useAuthRedirectHandler = () => {
  const invalidate = useInvalidateAllSmartEmsQueries()
  const { code, state } = getCodeAndStateFromUrl()
  const {data} = useQuery({
    queryKey: ["AuthSmartEMS", code, state],
    queryFn: () => {
      if (code && state) {
        return authorizeWithCodeAPI(code, state)
      }
      return false
    },
    retry: false
  })

  useEffect(() => {
    if (!data) {
      return
    }

    saveAuthorizationDataToLocalStorage(data)
    clearUrlParams()
    invalidate()

  // Only data is not stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])
}
