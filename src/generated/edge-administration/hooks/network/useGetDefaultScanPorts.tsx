import { edgeApi } from "../../api";

/** The global list of ports scanned on every device at minimum - see Settings' Service Types
 * section. */
export default function useGetDefaultScanPorts() {
  return edgeApi.useQuery("get", "/network/default-scan-ports");
}
