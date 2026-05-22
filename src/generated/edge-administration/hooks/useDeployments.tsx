import { edgeApi } from "../api"

export function useListDeployments() {
    return edgeApi.useQuery("get", "/compose-deployments")
}

export function useGetActiveDeployment() {
    return edgeApi.useQuery("get", "/active-deployments")
}

export function useGetDeployment(name: string) {
    return edgeApi.useQuery("get", "/compose-deployments/{name}", {
        params: {
            path: { name },
        },
    })
}

export function useCreateOrUpdateDeployment() {
    return edgeApi.useMutation("put", "/compose-deployments")
}

export function useSetActiveDeployment() {
    return edgeApi.useMutation("post", "/active-deployments/{name}")
}

export function useDeleteActiveDeployment() {
    return edgeApi.useMutation("delete", "/active-deployments")
}

export function useDeleteDeployment() {
    return edgeApi.useMutation("delete", "/compose-deployments/{name}")
}