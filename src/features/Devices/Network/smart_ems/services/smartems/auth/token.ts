import { jwtDecode } from "jwt-decode"
import { getSmartEmsAuth } from "./local_storage"

export const getSmartEmsDecodedToken = () => {
  const auth = getSmartEmsAuth()
  try {
    return jwtDecode(auth?.token ?? "")
  } catch (err) {
    console.error("Error while decoding smart ems token", err)
  }
}

export const isExpired = (exp: number) => {
  const now = Date.now() / 1000
  return exp < now
}
