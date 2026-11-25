# Edge Config App

The Edge Config App is a web application for operations and engineering teams to manage configurations across a fleet of IIoT Edge devices.
It communicates with the [Edge Config Api](https://github.com/eclipse-sealman/sealman-edge-config-api) and the [SEALMAN Ems](https://github.com/eclipse-sealman/sealman-ems).

### Prerequisites

Node 22+ is required. Install it via nvm (one-time setup):

```bash
nvm install 22
```

### Running locally

**Local (cross platform):**
```bash
npm install
npm run dev
```

**Devcontainer:** open the command palette (`Ctrl/Cmd+Shift+P`) -> `Reopen in Container`, then run the same commands above.

Visit http://localhost:3000

**To activate SSL on the dev server:** add `VITE_USE_DEV_SERVER_SSL=true` to your `.env.local`.

## Environment Setup

Copy `env.local.example` to `.env.local` and fill in the values.

`VITE_VERSION` is baked into the container image at build time; all other variables must be injected at runtime when deploying with Docker.

### General

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URI` | Yes | Base URL of the Edge Config API. |
| `VITE_VERSION` | No | Application version shown in the UI. Defaults to `local-development`. |
| `VITE_WEBVNC_URI` | No | Base URL of the WebVNC API. Required for the WebVNC feature. |
| `VITE_WEBVNC_API_KEY` | No | API key for the WebVNC API. |
| `VITE_SEMS_API_URL` | Yes | Base URL of the Smart EMS API. |
| `VITE_DEVICE_PASSWORD_ENABLED` | No | Set to `true` to enable the core device password UI. Disabled by default. |

### Authentication

Set `VITE_AUTHENTICATION_PROVIDER` to `keycloak` (default) or `entra` and fill in the corresponding variables below.

| Variable | Provider | Description |
|---|---|---|
| `VITE_AUTHENTICATION_PROVIDER` | - | Authentication provider to use: `keycloak` or `entra`. Defaults to `keycloak`. |
| `VITE_KEYCLOAK_AUTHORITY` | keycloak | Keycloak realm URL (e.g., `http://localhost:8080/realms/local-dev`). |
| `VITE_KEYCLOAK_CLIENT_ID` | keycloak | Keycloak client ID. |
| `VITE_ENTRA_ID_AUTHORITY` | entra | Entra ID authority URL. |
| `VITE_ENTRA_ID_CLIENT_ID` | entra | Entra ID application (client) ID. |
| `VITE_ENTRA_ID_REDIRECT_URI` | entra | Redirect URL after login (e.g., `http://localhost:3000`). |
| `VITE_API_SCOPES` | entra | Comma-separated OAuth scopes requested when acquiring API tokens. |

### Device metadata

The gateway's device type is read-only when editing metadata. Select the type when creating the device; it cannot be changed afterward.

### Device assets

The Assets list follows the Device > Endpoint > Service hierarchy using the upstream inline-edit layout. Device metadata starts collapsed. Endpoint headers show identity, type, service/port summaries, and connection state when scanning is enabled. Expand an endpoint to access its independently collapsible details and a tab for each service, with editing and browsing kept inside the endpoint. Details are read-only until Edit is selected. Canvas details reuse the same endpoint row in a dialog, including endpoint extension sections.

List values display as compact labeled items; editing uses item cards with Add item and remove controls. Cancel restores the saved display without submitting changes. Network responses determine port assignments and connection state; a read-time field default does not establish an assignment. Separate configured services remain distinct even when they share the same port. The latest successful configuration snapshot controls endpoint/service membership and metadata, so cached scans cannot restore deleted assets or overwrite edited hosts. Cached connection states apply only to the same host and service ID/port; unclaimed discoveries remain visible. Failed or pending configuration refreshes retain the last successful snapshot.

### Endpoint list fields

Asset Configuration > Endpoint Types supports **List** fields with one or more scalar row fields (text, boolean, integer, or number). Nested lists and the reserved row-field key `id` are not supported. Lists have no widget, default, options, or list-level validation; configure constraints and defaults on their row fields instead. Required lists need at least one row.

Endpoint assignment and details support adding, editing, and removing rows. Saving replaces the whole list, preserving server row IDs and unknown row properties; new rows receive IDs from the API. Removing all rows clears an optional list. Row-field `changeable` flags are not enforced by the API and do not lock row inputs. Fields marked **Show in list** display an item count in endpoint summaries; expanded details show labeled item values in configured column order. Invalid legacy values require explicit replacement before saving.

### API access errors

Assets and the VPN endpoint list show "Not permitted" after an API 403 and hide previously loaded restricted results. In Assets, a discovery denial stops scanning but preserves the independent configured-endpoint read, showing endpoints with their last-known status. A denial of that endpoint read hides the Assets results. The affected workflow stops automatic requests until an explicit retry or a device/account change. Gateway VPN controls remain available independently.

Applications stops config-status polling after HTTP 400 or 403; retry explicitly or correct the module IDs to resume. System module IDs such as `$edgeAgent` and `$edgeHub` are sent unchanged. If saving additional scan ports is denied, the custom scan can still use those ports temporarily without retrying the save in the background.

### Device passwords

Device Config > Security is a core feature, not an extension. Set `VITE_DEVICE_PASSWORD_ENABLED=true` to enable it. Otherwise the Security navigation, direct route, and password queries are disabled. The API determines device-type eligibility.

`.env` values are strings: use the canonical syntax `VITE_DEVICE_PASSWORD_ENABLED=true` or `VITE_DEVICE_PASSWORD_ENABLED=false` (no spaces around `=`). Only `true` enables this flag, ignoring case and surrounding whitespace; runtime boolean `true` is also accepted. False, missing, empty, malformed, `1`/`0`, and `yes`/`no` values all leave it disabled.

For local development, set it in `.env.local` and restart `npm run dev` after changing environment values. Docker defaults it to `false` and reads an override from the container environment at startup: recreate the container with the new value and reload the page. A deployed image must include this flag-handling code; changing only a runtime value cannot patch an older image.

Password information requires `device.read`; revealing a password requires `device.password.read`, and requesting renewal requires `device.password.write`. The UI uses the core `/{device}/password/info`, `/request`, and `/renew` endpoints. Deploy it with an API providing these endpoints; legacy SmartEMS routes remain a backend compatibility concern.

Revealing a password explicitly requests its value; the Security page shows the current persisted one-time automatic renewal schedule, not a snapshot in the reveal dialog. The UI displays backend timestamps in UTC without calculating or configuring schedules. Task `Completed` means the renewal request was accepted, not that the device password rotated. Manual renewal also waits for device communication and does not require config activation. Password information refreshes every ten seconds on active supported-device pages only while live renewal or an automatic task is pending. Idle pages retain normal focus/manual refresh, and reveal or renewal always refreshes information. An uncertain or aborted reveal also invalidates that device/account's information, since closing the response cannot undo an already saved schedule; the password request itself is never retried automatically.

Plaintext is held only in the open reveal dialog, not in browser storage or query/mutation caches. Closing the dialog, starting renewal, changing device/account/permissions, or detecting a password update clears it. Reveal requests are never automatically retried or repeated on refocus/reconnect; retry a failed request explicitly.

Security shows password reveal, the password service's created/updated date, and a short renewal status/action. Active automatic renewal shows its approximate UTC time; a failure stays visible with guidance to try manual renewal. Historical tasks, diagnostics, and implementation details are not shown on the page or reveal dialog. Canceled/completed tasks never appear as upcoming renewals or confirmation of a password change.

### Extension credentials

Platform Configuration > Extensions requires `extension.read`. Registration, editing, internal-key rotation, and device-key issue/revoke require `extension.register`; disabling/deregistering requires `extension.deregister`. The API remains authoritative if access changes.

Registration displays `internal_key` once when returned by the API. Internal routes use `X-Internal-Key`; rotation invalidates the previous key immediately. HTTP routes with `device` visibility use per-device `X-Device-Key` credentials on the field-ingress API. Their detail page lists key metadata and allows issuing/replacing or confirming revocation of a key. Optional module IDs are metadata, not an authentication restriction.

Copy newly issued credentials before closing their dialogs: they are not saved to browser storage or query caches, and cannot be retrieved by the UI later. Device-key endpoints and registration-time keys require the corresponding local API changes; the published older API does not provide them.

Extension details show initial internal-key issuance and the most recent rotation separately; rotation does not change the initial issuance timestamp. Unknown legacy issuance dates show "Not available"; before the first rotation, the UI shows "Never rotated". Device-key history includes UUIDs, optional labels/descriptions, issuance and revocation timestamps, and active/revoked status. Only one key is active per extension/device: issuing a replacement immediately revokes the previous record without removing its history. Revocation targets the selected key's UUID, not the device ID.

## Running in Docker

```bash
docker build . -t edge-configuration-app
docker run --rm --name edge-configuration-app -p 3000:8080 \
	-e VITE_SEMS_API_URL="https://smart-ems.example.com" \
	edge-configuration-app
```

## Key Dependencies

| Dependency | Purpose |
|---|---|
| [Vite](https://vitejs.dev) | Build tool and dev server |
| [React Router](https://reactrouter.com/en/main) | Client-side routing (`src/App.tsx`) |
| [Tailwind CSS](https://tailwindcss.com/docs) | Utility-first styling |
| [React Query](https://tanstack.com/query/latest) | Data fetching, caching and synchronization |
| [Tanstack Table](https://tanstack.com/table/latest) | Tables and datagrids |
| [MSAL React](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/README.md) | Authentication with Azure Entra ID |
| [React Leaflet](https://react-leaflet.js.org/) | World map |
| [Lucide React](https://lucide.dev/) | Primary icon set used across the UI |
| [Hero Icons](https://heroicons.com/) | Additional icon set used in some components |
| [React Toastify](https://www.npmjs.com/package/react-toastify) | User notifications and alerts |
| [Radix UI](https://www.radix-ui.com/) | Accessible component primitives (dialogs, dropdowns, tabs, etc.) |
