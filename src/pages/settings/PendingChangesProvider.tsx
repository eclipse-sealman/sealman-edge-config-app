import { useCallback, useContext, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { WaterLoader } from "@/components/ui/water-loader";
import { getErrorMessage } from "@/lib/errors";
import { PendingRegisterContext, PendingSectionsContext, type PendingSection } from "./pendingChanges";

export function PendingChangesProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<Record<string, PendingSection>>({});

  const register = useCallback((id: string, section: PendingSection | null) => {
    setSections((previous) => {
      if (section) return { ...previous, [id]: section };
      if (!(id in previous)) return previous;
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }, []);

  return (
    <PendingRegisterContext.Provider value={register}>
      <PendingSectionsContext.Provider value={sections}>{children}</PendingSectionsContext.Provider>
    </PendingRegisterContext.Provider>
  );
}

/** Saves every changed section of the current page after the user has confirmed. */
export function SaveChangesButton() {
  const sections = useContext(PendingSectionsContext);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  const dirty = Object.values(sections)
    .filter((section) => section.dirty)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const invalid = dirty.find((section) => section.error);

  // The current device configuration has to be valid before anything is changed.
  const checkThenConfirm = async () => {
    setChecking(true);
    try {
      const result = await edgeConfigApi.testDeviceConfig();
      if (!result.valid) {
        toast.error(`Device config check failed: ${result.message}. Nothing was saved.`);
        return;
      }
      setConfirmOpen(true);
    } catch (error) {
      toast.error(`Device config check failed: ${getErrorMessage(error)}. Nothing was saved.`);
    } finally {
      setChecking(false);
    }
  };

  const saveAll = async () => {
    setSaving(true);
    let current = "";
    try {
      for (const section of dirty) {
        current = section.label;
        await section.save();
      }
      toast.success("Changes saved");
    } catch (error) {
      toast.error(`Could not save ${current}: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => void checkThenConfirm()}
        disabled={dirty.length === 0 || saving || checking || invalid !== undefined}
        title={invalid ? `${invalid.label}: ${invalid.error}` : undefined}
      >
        {(saving || checking) && <WaterLoader />}
        {saving ? "Saving..." : checking ? "Checking..." : "Save"}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply these changes to the whole platform?</AlertDialogTitle>
            <AlertDialogDescription>
              Global device settings are applied to all existing devices and to every device created afterwards. Wrong
              values can cut devices off from SEMS or the IoT Hub, so that they no longer receive any configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-sm">
            <p className="font-medium">Changed:</p>
            <ul className="list-disc pl-5 text-muted-foreground">
              {dirty.map((section) => (
                <li key={section.label}>{section.label}</li>
              ))}
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void saveAll()}>Yes, save changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
