import { MutationCache, QueryClient, QueryClientConfig } from "@tanstack/react-query";
import { AxiosError } from 'axios';

const retryFunction = (failureCount: number, error: unknown) => {
  if (error instanceof AxiosError && error.response) {
    if (error.response.status >= 400 && error.response.status < 500)  // Don't retry client errors
    return false;
  }
  if (failureCount > 1)
    return false;
  return true;
}

// Config object to be passed to queryClient on initialization
const queryConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 10000,  // Prevents refetching to often because the APi blocks if too many requests arrive
      retry: retryFunction
    },
  },
  mutationCache: new MutationCache({
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  })
};

export const queryClient = new QueryClient(queryConfig);
