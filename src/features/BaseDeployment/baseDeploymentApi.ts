import { useMutation, useQuery } from "@tanstack/react-query";
import { edgeConfigApiInstance } from "@/api/edgeConfig/edgeConfigApi";
import { queryClient } from "@/config/queryConfig";

export type RestartPolicy = "always" | "never" | "on-failure" | "on-unhealthy";
export type ModuleStatus = "running" | "stopped";

export interface BaseDeploymentModule {
  name: string;
  image: string;
  restart_policy: RestartPolicy;
  status: ModuleStatus;
  /** Docker create options as a JSON string; empty for none. */
  create_options: string;
  env: Record<string, string>;
  /** Desired properties of the module twin. */
  twin: Record<string, unknown>;
}

export interface BaseDeployment {
  modules: BaseDeploymentModule[];
  /** Environment variables of the edgeHub system module. */
  edge_hub_env: Record<string, string>;
  /** The complete deployment document as stored in the database. */
  manifest: Record<string, unknown>;
  /** False while the shipped default is shown and nothing has been saved yet. */
  stored: boolean;
}

export const BASE_DEPLOYMENT_QUERY_KEY = ["baseDeployment"] as const;

export function useBaseDeployment() {
  return useQuery({
    queryKey: BASE_DEPLOYMENT_QUERY_KEY,
    queryFn: async () => (await edgeConfigApiInstance.get<BaseDeployment>("/platform/base-deployment")).data,
  });
}

export function useSaveBaseDeployment() {
  return useMutation({
    mutationFn: async (update: { modules: BaseDeploymentModule[]; edge_hub_env: Record<string, string> }) =>
      (await edgeConfigApiInstance.put<BaseDeployment>("/platform/base-deployment", update)).data,
    onSuccess: (data) => queryClient.setQueryData(BASE_DEPLOYMENT_QUERY_KEY, data),
  });
}

export function useResetBaseDeployment() {
  return useMutation({
    mutationFn: async () => (await edgeConfigApiInstance.delete<BaseDeployment>("/platform/base-deployment")).data,
    onSuccess: (data) => queryClient.setQueryData(BASE_DEPLOYMENT_QUERY_KEY, data),
  });
}
