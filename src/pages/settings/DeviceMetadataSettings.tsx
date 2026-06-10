import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { edgeConfigApi, MetadataKeyOptions } from "@/api/edgeConfig/edgeConfigApi";
import SimpleDialog from "@/components/Modal/SimpleDialog";
import Button, { ButtonColor, ButtonSize } from "@/components/Input/Button";

function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const raw = err.response?.data?.message;
    if (typeof raw === "string") {
      const match = raw.match(/['"]message['"]\s*:\s*"([^"]*)"/);
      return match ? match[1] : raw;
    }
    return err.message;
  }
  return String(err);
}

const MAX_AFFECTED_DEVICES_DISPLAY = 5;

interface MetadataKeyEntry {
  key: string;
  prepopulate: boolean;
  allowAddition: boolean;
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange?: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={[
        "relative inline-flex h-[22px] w-[42px] shrink-0 rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-1",
        checked ? "bg-blue-500" : "bg-slate-200",
        disabled
          ? "opacity-40 cursor-not-allowed saturate-50"
          : "cursor-pointer hover:brightness-95",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow-md",
          "ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

export default function DeviceMetadataSettings() {
  const [keys, setKeys] = useState<MetadataKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState("");
  const [newPrepopulate, setNewPrepopulate] = useState(false);
  const [newAllowAddition, setNewAllowAddition] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);
  const [affectedDevices, setAffectedDevices] = useState<string[]>([]);

  useEffect(() => { loadKeys(); }, []);

  const loadKeys = async () => {
    try {
      const data = await edgeConfigApi.getMetadataKeys();
      const entries: MetadataKeyEntry[] = Object.entries(data)
        .map(([key, options]) => ({
          key,
          prepopulate: options.prepopulate,
          allowAddition: options.allowAddition,
        }))
        .sort((a, b) => a.key.localeCompare(b.key));
      setKeys(entries);
    } catch (err) {
      toast.error(`Failed to load metadata keys. ${getApiErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = newKey.trim();
    if (!trimmed) { setError("Key is required"); return; }
    if (keys.some((k) => k.key.toLowerCase() === trimmed.toLowerCase())) {
      setError("Key already exists"); return;
    }
    const options: MetadataKeyOptions = {
      prepopulate: newPrepopulate,
      allowAddition: newPrepopulate ? newAllowAddition : false,
    };
    try {
      await edgeConfigApi.addMetadataKey(trimmed, options);
      setKeys((prev) =>
        [...prev, { key: trimmed, ...options }].sort((a, b) => a.key.localeCompare(b.key))
      );
      setNewKey("");
      setNewPrepopulate(false);
      setNewAllowAddition(true);
      setError(null);
      toast.success(`Metadata key "${trimmed}" added`);
    } catch (err) {
      toast.error(`Failed to add metadata key. ${getApiErrorMessage(err)}`);
    }
  };

  const initiateDelete = async (key: string) => {
    try {
      const devices = await edgeConfigApi.getDevicesWithMetaKey(key);
      if (devices.length > 0) {
        setAffectedDevices(devices);
        setPendingDeleteKey(key);
      } else {
        await performDelete(key);
      }
    } catch (err) {
      toast.error(`Failed to check devices for metadata key "${key}". ${getApiErrorMessage(err)}`);
    }
  };

  const performDelete = async (key: string) => {
    try {
      await edgeConfigApi.deleteMetadataKey(key);
      setKeys((prev) => prev.filter((k) => k.key !== key));
      toast.success(`Metadata key "${key}" removed`);
    } catch (err) {
      toast.error(`Failed to delete metadata key "${key}". ${getApiErrorMessage(err)}`);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteKey) return;
    const key = pendingDeleteKey;
    setPendingDeleteKey(null);
    setAffectedDevices([]);
    await performDelete(key);
  };

  const cancelDelete = () => {
    setPendingDeleteKey(null);
    setAffectedDevices([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAdd();
  };

  if (loading) return <div>Loading metadata keys...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Device Metadata</h2>

      <div className="bg-card border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Metadata Keys</h3>
        <p className="text-sm text-muted-foreground">
          Define the keys that can be used as device metadata. These keys will be displayed for every device.
          <br />
          You cannot remove metadata keys that are currently in use by devices. To remove such keys, first remove the corresponding metadata values from all devices.
        </p>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground border-b">Key</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground border-b w-44">Prepopulate Values</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground border-b w-40">Allow Addition</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground border-b w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No metadata keys defined
                  </td>
                </tr>
              ) : (
                keys.map((entry) => (
                  <tr key={entry.key} className="bg-background hover:bg-muted/40 transition-colors border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{entry.key}</td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <Toggle checked={entry.prepopulate} disabled />
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        {entry.prepopulate ? (
                          <Toggle checked={entry.allowAddition} disabled />
                        ) : (
                          <span className="text-muted-foreground/30 text-lg leading-none select-none">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => initiateDelete(entry.key)}
                        className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors shadow-sm"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}

              <tr className="bg-blue-50/40 border-t">
                <td className="px-3 py-2.5">
                  <input
                    type="text"
                    placeholder="New metadata key"
                    value={newKey}
                    onChange={(e) => { setNewKey(e.target.value); setError(null); }}
                    onKeyDown={handleKeyDown}
                    className="
                      w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm bg-white
                      placeholder:text-slate-400
                      focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20
                      transition-shadow
                    "
                  />
                </td>

                <td className="px-4 py-2.5">
                  <div className="flex justify-center">
                    <Toggle
                      checked={newPrepopulate}
                      onChange={(val) => {
                        setNewPrepopulate(val);
                        if (!val) setNewAllowAddition(true);
                      }}
                    />
                  </div>
                </td>

                <td className="px-4 py-2.5">
                  <div className="flex justify-center">
                    {newPrepopulate ? (
                      <Toggle checked={newAllowAddition} onChange={setNewAllowAddition} />
                    ) : (
                      <span className="text-muted-foreground/30 text-lg leading-none select-none">—</span>
                    )}
                  </div>
                </td>

                <td className="px-3 py-2.5 text-center">
                  <button
                    onClick={handleAdd}
                    className="
                      inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium
                      bg-primary/10 text-primary border border-primary/20
                      hover:bg-primary hover:text-white hover:border-primary
                      transition-all shadow-sm
                    "
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </div>

      <SimpleDialog
        isOpen={pendingDeleteKey !== null}
        title={`Delete metadata key "${pendingDeleteKey}"`}
      >
        <div className="space-y-4">
          <p className="text-sm">
            The following devices have a value set for this key. The key will be removed from the
            platform, but the existing values on these devices will remain.
          </p>
          <ul className="text-sm font-medium space-y-1 pl-4 list-disc">
            {affectedDevices.slice(0, MAX_AFFECTED_DEVICES_DISPLAY).map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
          {affectedDevices.length > MAX_AFFECTED_DEVICES_DISPLAY && (
            <p className="text-sm text-muted-foreground">
              and {affectedDevices.length - MAX_AFFECTED_DEVICES_DISPLAY} more...
            </p>
          )}
          <p className="text-sm">Do you want to proceed?</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button size={ButtonSize.Small} color={ButtonColor.Red} onClick={confirmDelete}>Delete</Button>
            <Button size={ButtonSize.Small} color={ButtonColor.Gray} onClick={cancelDelete}>Cancel</Button>
          </div>
        </div>
      </SimpleDialog>
    </div>
  );
}
