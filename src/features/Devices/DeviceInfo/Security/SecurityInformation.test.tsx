import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { queryClient } from "@/config/queryConfig";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import type { UsePermissionsOptions } from "@/features/authorization/permissions/use-permissions";
import type { components, paths } from "@/generated/edge-administration/types";
import SecurityInformation from "./SecurityInformation";

const { apiRequest, permissions, auth, successToast, flag } = vi.hoisted(() => ({
  apiRequest: vi.fn<(request: Request) => Promise<Response>>(),
  permissions: vi.fn(),
  auth: { user: { iss: "test", sub: "reader" } },
  successToast: vi.fn(),
  flag: { enabled: true },
}));

vi.mock("@/config/devicePassword", () => ({ isDevicePasswordEnabled: () => flag.enabled }));
vi.mock("@/auth", () => ({ useAuth: () => auth }));
vi.mock("@/features/authorization/permissions/use-permissions", () => ({ usePermissions: permissions }));
vi.mock("react-toastify", () => ({ toast: { success: successToast } }));
vi.mock("@/generated/edge-administration/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/generated/edge-administration/api")>();
  const { default: createFetchClient } = await import("openapi-fetch");
  const { default: createReactQueryClient } = await import("openapi-react-query");
  const client = createFetchClient<paths>({ baseUrl: "http://password.test", fetch: apiRequest });
  client.use(actual.errorHandlerMiddleware);
  return { ...actual, client, edgeApi: createReactQueryClient(client) };
});

const task: components["schemas"]["PasswordRenewalTaskInformation"] = {
  taskId: "task-1",
  scheduledTime: "2026-11-17T00:00:00Z",
  status: "Pending",
  errorCount: 0,
  latestError: null,
  createdAt: "2026-11-16T12:00:00Z",
  updatedAt: "2026-11-16T12:00:00Z",
};
let info: components["schemas"]["DeviceSecretInformation"];
let denied: Set<string>;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

function page(deviceId = "eg-1") {
  return (
    <MemoryRouter initialEntries={[`/devices/${deviceId}/device-config/security`]}>
      <Routes><Route path="/devices/:deviceId/device-config/security" element={<SecurityInformation />} /></Routes>
    </MemoryRouter>
  );
}

function requests(method: string) {
  return apiRequest.mock.calls.map(([request]) => request).filter((request: Request) => request.method === method);
}

async function reveal() {
  fireEvent.click(await screen.findByRole("button", { name: "Show password value" }));
  return screen.findByRole("textbox", { name: "Device password" });
}

beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
  flag.enabled = true;
  auth.user = { iss: "test", sub: "reader" };
  denied = new Set();
  info = {
    id: 1,
    deviceTypeHasAuthSecret: true,
    forceRenewal: false,
    secretValueRenewAfterDays: 1,
    secretCreatedAt: "2026-11-16T11:00:00Z",
    secretUpdatedAt: null,
    renewalTask: null,
  };
  permissions.mockImplementation(({ permissionKey }: UsePermissionsOptions) => ({
    hasPermission: !denied.has(permissionKey),
    noPermissionsMessage: denied.has(permissionKey) ? "Permission required." : undefined,
  }));
  apiRequest.mockImplementation(async (request: Request) => {
    const path = new URL(request.url).pathname;
    if (request.method === "GET" && path.endsWith("/password/info")) return json(info);
    if (request.method === "POST" && path.endsWith("/password/request")) {
      info = { ...info, renewalTask: task };
      return json({ id: 1, secretValue: "test-password", renewalTask: task });
    }
    if (request.method === "POST" && path.endsWith("/password/renew")) {
      info = { ...info, forceRenewal: true };
      return json({ requestAccepted: true });
    }
    throw new Error(`Unexpected test request: ${request.method} ${path}`);
  });
});

afterEach(() => {
  queryClient.clear();
  vi.useRealTimers();
});

it("reveals explicitly, shows the persisted schedule, and never caches plaintext or background POSTs", async () => {
  render(page());
  await screen.findByText("Device Security");
  expect(requests("POST")).toHaveLength(0);
  expect(await reveal()).toHaveValue("test-password");
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).queryByText(/Automatic renewal scheduled around/)).not.toBeInTheDocument();
  expect(within(dialog).queryByText("Automatic renewal details")).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getAllByText(/Automatic renewal scheduled around/)).toHaveLength(1));

  await act(async () => {
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
    await queryClient.invalidateQueries();
  });
  expect(requests("POST")).toHaveLength(1);
  expect(JSON.stringify(queryClient.getQueryCache().getAll().map((query) => query.state))).not.toContain("test-password");
  expect(JSON.stringify(queryClient.getMutationCache().getAll().map((mutation) => mutation.state))).not.toContain("test-password");

  fireEvent.click(within(dialog).getAllByRole("button", { name: "Close" })[1]);
  expect(screen.queryByRole("textbox", { name: "Device password" })).not.toBeInTheDocument();
  await reveal();
  expect(requests("POST")).toHaveLength(2);
  expect(requests("POST")[0].cache).toBe("no-store");
});

it("clears the reveal on renewal and distinguishes requested from rotated", async () => {
  render(page());
  await reveal();
  fireEvent.click(screen.getAllByRole("button", { name: "Close" })[1]);
  fireEvent.click(screen.getByRole("button", { name: "Renew password" }));
  fireEvent.click(screen.getByRole("button", { name: "OK" }));
  await screen.findByText("Password renewal pending. Waiting for the device to connect.");
  expect(successToast).toHaveBeenCalledWith("Password renewal requested for eg-1. Waiting for the device to connect.");
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(requests("POST").map((request: Request) => new URL(request.url).pathname)).toEqual([
    "/eg-1/password/request", "/eg-1/password/renew",
  ]);
});

it.each(["forceRenewal", "secretUpdatedAt"] as const)("clears a revealed value when live %s changes", async (field) => {
  render(page());
  await reveal();
  await waitFor(() => expect(screen.getAllByText(/Automatic renewal scheduled around/)).toHaveLength(1));
  info = field === "forceRenewal" ? { ...info, forceRenewal: true } : { ...info, secretUpdatedAt: "2026-11-16T13:00:00Z" };
  await act(async () => { await queryClient.invalidateQueries(); });
  await waitFor(() => expect(screen.queryByRole("textbox", { name: "Device password" })).not.toBeInTheDocument());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(requests("POST")).toHaveLength(1);
});

it("refreshes live information after device communication clears forceRenewal", async () => {
  vi.useFakeTimers();
  info.forceRenewal = true;
  render(page());
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(screen.getByText("Password renewal pending. Waiting for the device to connect.")).toBeInTheDocument();
  info = { ...info, forceRenewal: false, secretUpdatedAt: "2026-11-16T13:00:00Z" };
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
  expect(screen.getByRole("button", { name: "Renew password" })).toBeInTheDocument();
  expect(requests("GET")).toHaveLength(2);
  await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
  expect(requests("GET")).toHaveLength(2);
  expect(requests("POST")).toHaveLength(0);
});

it.each([
  [null, false, false],
  ["Pending", false, true],
  ["Completed", false, false],
  ["Canceled", false, false],
  ["Error", false, false],
  ["Completed", true, true],
] as const)("polls only actionable state at 10s (task=%s, forceRenewal=%s)", async (status, forceRenewal, shouldPoll) => {
  vi.useFakeTimers();
  info = { ...info, forceRenewal, renewalTask: status ? { ...task, status } : null };
  render(page());
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(requests("GET")).toHaveLength(1);
  await act(async () => { await vi.advanceTimersByTimeAsync(9998); });
  expect(requests("GET")).toHaveLength(1);
  await act(async () => { await vi.advanceTimersByTimeAsync(2); });
  expect(requests("GET")).toHaveLength(shouldPoll ? 2 : 1);
  await act(async () => { await queryClient.invalidateQueries(); });
  expect(requests("GET")).toHaveLength(shouldPoll ? 3 : 2);
  expect(requests("POST")).toHaveLength(0);
});

it("stops interval requests after an information API error even while renewal was pending", async () => {
  vi.useFakeTimers();
  info.forceRenewal = true;
  render(page());
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  apiRequest.mockImplementation(async () => json({ message: "Access denied" }, 403));
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
  expect(screen.getByText("Not permitted")).toBeInTheDocument();
  await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
  expect(requests("GET")).toHaveLength(2);
});

it.each(["permissions", "account", "device"] as const)("discards an in-flight reveal on %s change", async (change) => {
  let finish: ((response: Response) => void) | undefined;
  apiRequest.mockImplementation(async (request: Request) =>
    request.method === "GET" ? json(info) : new Promise<Response>((resolve) => { finish = resolve; }),
  );
  const mounted = render(page());
  fireEvent.click(await screen.findByRole("button", { name: "Show password value" }));
  await waitFor(() => expect(finish).toBeDefined());
  if (change === "permissions") denied.add(PERMISSION_KEYS.DEVICE_PASSWORD_READ);
  if (change === "account") auth.user = { iss: "test", sub: "another-reader" };
  if (change === "device") {
    mounted.unmount();
    render(page("eg-2"));
  } else {
    mounted.rerender(page());
  }
  await act(async () => { finish?.(json({ id: 1, secretValue: "late-password", renewalTask: null })); });
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(requests("POST")).toHaveLength(1);
  expect(requests("POST")[0].signal.aborted).toBe(true);
});

it("does not retry a denied reveal or retain an old password", async () => {
  apiRequest.mockImplementation(async (request: Request) =>
    request.method === "GET" ? json(info) : json({ message: "Access denied" }, 403),
  );
  render(page());
  fireEvent.click(await screen.findByRole("button", { name: "Show password value" }));
  await screen.findByText("Not permitted to view this device password.");
  await act(async () => { await queryClient.invalidateQueries(); });
  expect(requests("POST")).toHaveLength(1);
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(within(screen.getByRole("dialog")).queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
});

it("requires an explicit retry after a failed reveal", async () => {
  let failed = true;
  apiRequest.mockImplementation(async (request: Request) =>
    request.method === "GET" ? json(info) : failed ? json({ message: "SEMS unavailable" }, 502) : json({ id: 1, secretValue: "retry-password", renewalTask: null }),
  );
  render(page());
  fireEvent.click(await screen.findByRole("button", { name: "Show password value" }));
  await screen.findByText("Could not get the password: SEMS unavailable");
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
    await queryClient.invalidateQueries();
  });
  expect(requests("POST")).toHaveLength(1);
  failed = false;
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("textbox", { name: "Device password" })).toHaveValue("retry-password");
  expect(requests("POST")).toHaveLength(2);
});

it("cannot restore a late password into a closed or reopened dialog", async () => {
  let finish: ((response: Response) => void) | undefined;
  apiRequest.mockImplementation(async (request: Request) => {
    if (request.method === "GET") return json(info);
    if (!finish) return new Promise<Response>((resolve) => { finish = resolve; });
    return json({ id: 1, secretValue: "fresh-password", renewalTask: null });
  });
  render(page());
  fireEvent.click(await screen.findByRole("button", { name: "Show password value" }));
  await waitFor(() => expect(finish).toBeDefined());
  fireEvent.click(screen.getAllByRole("button", { name: "Close" })[1]);
  expect(requests("POST")[0].signal.aborted).toBe(true);
  expect(await reveal()).toHaveValue("fresh-password");
  await act(async () => { finish?.(json({ id: 1, secretValue: "late-password", renewalTask: null })); });
  expect(screen.getByRole("textbox", { name: "Device password" })).toHaveValue("fresh-password");
  expect(JSON.stringify(queryClient.getMutationCache().getAll().map((mutation) => mutation.state))).not.toContain("late-password");
});

it.each(["close", "unmount"] as const)("reconciles an already persisted schedule after reveal %s aborts its response", async (action) => {
  apiRequest.mockImplementation(async (request: Request) => {
    if (request.method === "GET") return json(info);
    info = { ...info, renewalTask: task };
    return new Promise<Response>((_resolve, reject) => {
      request.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    });
  });
  const mounted = render(page());
  fireEvent.click(await screen.findByRole("button", { name: "Show password value" }));
  await waitFor(() => expect(requests("POST")).toHaveLength(1));
  const sourceKey = queryClient.getQueryCache().getAll()[0].queryKey;
  const otherAccountKey = [...sourceKey.slice(0, -1), "another-reader"];
  queryClient.setQueryData(otherAccountKey, { ...info, renewalTask: null });
  if (action === "close") {
    fireEvent.click(screen.getAllByRole("button", { name: "Close" })[1]);
  } else {
    mounted.unmount();
    await waitFor(() => expect(queryClient.getQueryCache().getAll()[0].state.isInvalidated).toBe(true));
    render(page());
  }
  await screen.findByText(/Automatic renewal scheduled around/);
  expect(requests("GET")).toHaveLength(2);
  expect(requests("POST")).toHaveLength(1);
  expect(requests("POST")[0].signal.aborted).toBe(true);
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(queryClient.getQueryState(otherAccountKey)?.isInvalidated).toBe(false);
});

it.each(["Error", "Canceled", "Completed"] as const)("keeps live %s scheduling state out of the revealed password snapshot", async (status) => {
  render(page());
  await reveal();
  await screen.findByText(/Automatic renewal scheduled around/);
  info = { ...info, renewalTask: { ...task, status } };
  await act(async () => { await queryClient.invalidateQueries(); });
  await waitFor(() => expect(screen.queryByText(/Automatic renewal scheduled around/)).not.toBeInTheDocument());
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByRole("textbox")).toHaveValue("test-password");
  expect(within(dialog).queryByText(/Automatic.*renewal/)).not.toBeInTheDocument();
  if (status === "Error") expect(screen.getByRole("alert", { hidden: true })).toHaveTextContent("Automatic password renewal failed.");
  expect(requests("POST")).toHaveLength(1);
});

it("closes confirmation when a live renewal becomes pending without sending a duplicate", async () => {
  render(page());
  fireEvent.click(await screen.findByRole("button", { name: "Renew password" }));
  expect(screen.getByRole("button", { name: "OK" })).toBeEnabled();
  info = { ...info, forceRenewal: true };
  await act(async () => { await queryClient.invalidateQueries(); });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByText("Password renewal pending. Waiting for the device to connect.")).toBeInTheDocument();
  info = { ...info, forceRenewal: false };
  await act(async () => { await queryClient.invalidateQueries(); });
  await screen.findByRole("button", { name: "Renew password" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(requests("POST")).toHaveLength(0);
});

it("handles failed renewal without an unhandled promise and keeps confirmation actionable", async () => {
  apiRequest.mockImplementation(async (request: Request) =>
    request.method === "GET" ? json(info) : json({ message: "SEMS unavailable" }, 502),
  );
  render(page());
  fireEvent.click(await screen.findByRole("button", { name: "Renew password" }));
  fireEvent.click(screen.getByRole("button", { name: "OK" }));
  await screen.findByText("Could not request password renewal: SEMS unavailable");
  expect(successToast).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "OK" })).toBeEnabled();
  expect(requests("POST")).toHaveLength(1);
});

it("disables actions without password permissions but still reads metadata", async () => {
  denied.add(PERMISSION_KEYS.DEVICE_PASSWORD_READ);
  denied.add(PERMISSION_KEYS.DEVICE_PASSWORD_WRITE);
  render(page());
  expect(await screen.findByRole("button", { name: "Show password value" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Renew password" })).toBeDisabled();
  expect(requests("GET")).toHaveLength(1);
  expect(requests("POST")).toHaveLength(0);
});

it.each(["flag", "device.read"] as const)("does not fetch password information when blocked by %s", async (block) => {
  if (block === "flag") {
    flag.enabled = false;
  }
  else denied.add(PERMISSION_KEYS.DEVICE_READ);
  render(page());
  await act(async () => {});
  expect(apiRequest).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Show password value" })).not.toBeInTheDocument();
});

it("does not offer password actions for an unsupported device type", async () => {
  info.deviceTypeHasAuthSecret = false;
  render(page());
  await screen.findByText("Password not configured for this device type.");
  expect(screen.queryByRole("button", { name: "Renew password" })).not.toBeInTheDocument();
  expect(requests("POST")).toHaveLength(0);
});

it("explains an uninitialized device password without offering reveal or renewal", async () => {
  info.id = null;
  render(page());
  await screen.findByText("Password for the device does not exist and will be auto-generated on next communication.");
  expect(screen.queryByRole("button", { name: "Show password value" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Renew password" })).not.toBeInTheDocument();
});

it.each([
  ["2026-11-16T13:00:00Z", "2026-11-16T11:00:00Z", "Last updated:"],
  [null, "2026-11-16T11:00:00Z", "Created:"],
  [null, null, "Date not available."],
] as const)("labels SEMS record timestamps truthfully (updated=%s, created=%s)", async (updated, created, label) => {
  info = { ...info, secretUpdatedAt: updated, secretCreatedAt: created, forceRenewal: true };
  render(page());
  const recordLabel = await screen.findByText("Device Password Last Updated");
  const record = recordLabel.closest("li");
  expect(record).not.toBeNull();
  expect(within(record!).getByText((text) => text.startsWith(label))).toBeInTheDocument();
  expect(within(record!).getByRole("button", { name: "About the password date" })).toBeInTheDocument();
  expect(screen.queryByText(/record metadata|independently verified|worker check/)).not.toBeInTheDocument();
  expect(within(record!).getByText("Password renewal pending. Waiting for the device to connect.")).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  if (label === "Created:") expect(within(record!).queryByText(/^Last updated:/)).not.toBeInTheDocument();
});

it("shows only a concise approximate automatic renewal date", async () => {
  info.renewalTask = task;
  render(page());
  await screen.findByText(/Automatic renewal scheduled around .*UTC/);
  expect(document.querySelector("details")).toBeNull();
  expect(screen.queryByText(/Task last updated|worker check|Originally scheduled/)).not.toBeInTheDocument();
});

it("shows pending device connection without canceled-task clutter", async () => {
  info = { ...info, forceRenewal: true, renewalTask: { ...task, status: "Canceled" } };
  render(page());
  await screen.findByText("Password renewal pending. Waiting for the device to connect.");
  expect(screen.queryByText(/Canceled|Originally scheduled|Automatic renewal scheduled/)).not.toBeInTheDocument();
  expect(document.querySelector("details")).toBeNull();
});

it.each(["Completed", "Canceled", "Error"] as const)("keeps %s state user-facing without history or diagnostics", async (status) => {
  info.renewalTask = { ...task, status, errorCount: status === "Error" ? 2 : 0, latestError: status === "Error" ? "SEMS unavailable" : null };
  render(page());
  await screen.findByText("Device Password Last Updated");
  expect(document.querySelector("details")).toBeNull();
  expect(screen.queryByText(/Originally scheduled|Automatic renewal scheduled|Task last updated|Failed attempts|SEMS unavailable|Completed|Canceled|request accepted/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Renew password" })).toBeEnabled();
  if (status === "Error") {
    expect(screen.getByRole("alert")).toHaveTextContent("Automatic password renewal failed. Use Renew password to try again.");
  } else {
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  }
  await reveal();
  expect(within(screen.getByRole("dialog")).queryByText(/Task last updated|Failed attempts|Automatic renewal details/)).not.toBeInTheDocument();
});
