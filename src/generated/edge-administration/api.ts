import createReactQueryClient from "openapi-react-query";
import createFetchClient, { Middleware } from "openapi-fetch";
import type { paths } from "./types";
import { getAccessToken } from "@/auth";

// oidc-client-ts's getUser() can, in rare cases (e.g. a stuck silent-renew iframe),
// hang far longer than any request should reasonably wait - bounding it here means a
// stuck token acquisition surfaces as a normal failed request instead of a request that
// never settles at all, no matter which screen/hook is waiting on it.
const TOKEN_ACQUISITION_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const isCypress = window.Cypress != undefined

    if (isCypress) {
      return request
    }

    try {
      const token = await withTimeout(
        getAccessToken(),
        TOKEN_ACQUISITION_TIMEOUT_MS,
        "Timed out acquiring an access token",
      );
      request.headers.set("Authorization", `Bearer ${token}`);
    } catch (err) {
      console.error("Couldn't acquire token", err);
      throw new Error("User is not authenticated")
    }
    return request;
  },
};

export class ApiError extends Error {
  statusCode: number;
  message: string;

  constructor(message: string, statusCode: number) {
    super(message);
    this.message = message;
    this.name = "ApiError";
    this.statusCode = statusCode;

    // This helps maintain the proper stack trace
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, ApiError);
    }
  }
}

export const errorHandlerMiddleware: Middleware = {
  async onResponse({ response }) {
    if (!response.ok) {
      const responseBody = await response.json();
      throw new ApiError(responseBody.message, response.status);
    }
    return response;
  },
};

export const client = createFetchClient<paths>({
  baseUrl: `${import.meta.env.VITE_API_URI}`,
});

client.use(authMiddleware, errorHandlerMiddleware);

export const edgeApi = createReactQueryClient(client);
