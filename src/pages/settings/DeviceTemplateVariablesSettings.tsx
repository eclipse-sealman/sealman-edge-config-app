import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";

type Config = Record<string, string>;

export default function DeviceTemplateVariablesSettings() {
  const [config, setConfig] = useState<Config>({});
  const [draft, setDraft] = useState<Config>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await edgeConfigApi.getDeviceTemplateVariables();
      setConfig(data);
      setDraft(data);
    } catch {
      toast.error("Failed to load device template variables.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await edgeConfigApi.updateDeviceTemplateVariables(draft);
      setConfig(updated);
      setDraft(updated);
      toast.success("Device template variables saved.");
    } catch {
      toast.error("Failed to save device template variables.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setDraft(config);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(config);

  if (loading) return <div>Loading device template variables...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Device Template Variables</h2>

      <div className="bg-card border rounded-lg p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          These variables are applied to every new device during creation. Edit and save to update them.
        </p>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground border-b w-1/3">
                  Variable
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground border-b">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(draft).map(([key, value]) => (
                <tr
                  key={key}
                  className="bg-background hover:bg-muted/40 transition-colors border-b last:border-b-0"
                >
                  <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                    {key}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type={key.includes("password") || key.includes("encoded") ? "password" : "text"}
                      value={value ?? ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="
                        w-full px-3 py-1.5 rounded-md text-sm
                        bg-muted/30
                        border border-slate-200
                        hover:border-slate-300
                        focus:bg-background
                        focus:border-primary
                        focus:ring-2 focus:ring-primary/20
                        outline-none
                        transition
                      "
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={handleReset}
            disabled={!isDirty || saving}
            className="
              px-4 py-1.5 rounded-md text-sm font-medium
              border border-slate-200
              hover:bg-muted/60
              disabled:opacity-40 disabled:cursor-not-allowed
              transition
            "
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="
              px-4 py-1.5 rounded-md text-sm font-medium
              bg-primary text-white
              hover:bg-primary/90
              disabled:opacity-40 disabled:cursor-not-allowed
              transition
            "
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}