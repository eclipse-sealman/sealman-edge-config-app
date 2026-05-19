import { MiddlewareCallbackParams } from "openapi-fetch"
import { authMiddleware } from "../api"
import * as auth from "@/auth";

describe("Auth Middleware", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("should have onRequest declared", () => {
    const middleware = authMiddleware

    expect(middleware.onRequest).toBeDefined()
  })

  it("should acquire token and set Authorization header", async () => {
    const middleware = authMiddleware
    const request = new Request("http://mydomain.com")
    const spyGetAccessToken = vi.spyOn(auth, "getAccessToken").mockResolvedValueOnce("my token")

    await middleware.onRequest!( {request} as MiddlewareCallbackParams)

    expect(spyGetAccessToken).toHaveBeenCalled()
    expect(request.headers.get("Authorization")).toBe("Bearer my token")
  })

  it("should throw error when token acquisition fails", async () => {
    const middleware = authMiddleware
    const request = new Request("http://mydomain.com")
    vi.spyOn(auth, "getAccessToken").mockRejectedValueOnce(new Error("No user authenticated"))

    await expect(middleware.onRequest!( {request} as MiddlewareCallbackParams)).rejects.toThrow("User is not authenticated")
  })

  it("should not call getAccessToken if environment is Cypress", async () => {
    const middleware = authMiddleware
    const request = new Request("http://mydomain.com")
    const spyGetAccessToken = vi.spyOn(auth, "getAccessToken")

    // Mock window.Cypress in jsdom environment
    Object.defineProperty(window, 'Cypress', {
      writable: true,
      configurable: true,
      value: true
    });

    const result = await middleware.onRequest!( {request} as MiddlewareCallbackParams)

    // Cleanup
    delete (window as any).Cypress;

    expect(spyGetAccessToken).not.toHaveBeenCalled()
    expect(result).toBe(request)
  })
})
