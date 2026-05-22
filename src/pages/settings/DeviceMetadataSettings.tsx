import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
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

export default function DeviceMetadataSettings() {
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);
  const [affectedDevices, setAffectedDevices] = useState<string[]>([]);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const data = await edgeConfigApi.getMetadataKeys();
      setKeys(data);
    } catch (err) {
      toast.error(`Failed to load metadata keys. ${getApiErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = newKey.trim();

    if (!trimmed) {
      setError("Key is required");
      return;
    }

    if (keys.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
      setError("Key already exists");
      return;
    }

    try {
      await edgeConfigApi.addMetadataKey(trimmed);
      setKeys((prev) => [...prev, trimmed].sort((a, b) => a.localeCompare(b)));
      setNewKey("");
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
      setKeys((prev) => prev.filter((k) => k !== key));
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

  if (loading) {
    return <div>Loading metadata keys...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Device Metadata</h2>

      <div className="bg-card border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Metadata Keys</h3>
        <p className="text-sm text-muted-foreground">
          Define the keys that can be used as device metadata. These keys will be displayed for every device.
          <br/>
          You cannot remove metadata keys that are currently in use by devices. To remove such keys, first remove the corresponding metadata values from all devices.
        </p>

        <div className="border rounded-md">
          <table className="w-full text-sm border-separate border-spacing-0 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-linear-to-r from-slate-100 to-slate-50 border-b">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Key
                </th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground w-20">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No metadata keys defined
                  </td>
                </tr>
              ) : (
                keys.map((key) => (
                  <tr key={key} className="bg-background hover:bg-muted/40 transition-colors border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{key}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => initiateDelete(key)}
                        className="
                          inline-flex items-center gap-1
                          px-3 py-1.5 rounded-md
                          bg-red-50 text-red-700
                          hover:bg-red-100
                          transition-all
                          font-medium
                          shadow-xs
                        "
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {/* Add row */}
              <tr className="bg-background border-t">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    placeholder="New metadata key"
                    value={newKey}
                    onChange={(e) => {
                      setNewKey(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={handleAdd}
                    className="
                      inline-flex items-center gap-1
                      px-4 py-2 rounded-md
                      bg-primary/10 text-primary
                      hover:bg-primary hover:text-white
                      transition-all
                      font-medium
                      shadow-xs
                    "
                  >
                    <PlusIcon className="w-4 h-4 mr-1 inline" />Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
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
          <ul className="text-sm font-medium space-y-1 pl-4 list-disc mb-0">
            {affectedDevices.slice(0, MAX_AFFECTED_DEVICES_DISPLAY).map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
          {affectedDevices.length > MAX_AFFECTED_DEVICES_DISPLAY && (
            <p className="text-sm text-muted-foreground text-left">and {affectedDevices.length - MAX_AFFECTED_DEVICES_DISPLAY} more...</p>
          )}
          <p className="text-sm mt-4">Do you want to proceed?</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button size={ButtonSize.Small} color={ButtonColor.Red} onClick={confirmDelete}>
              Delete
            </Button>
            <Button size={ButtonSize.Small} color={ButtonColor.Gray} onClick={cancelDelete}>
              Cancel
            </Button>
          </div>
        </div>
      </SimpleDialog>
    </div>
  );
}
