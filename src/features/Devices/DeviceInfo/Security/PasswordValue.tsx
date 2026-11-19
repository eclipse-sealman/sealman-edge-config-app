import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/page-state";
import { useState } from "react";
import type { components } from "@/generated/edge-administration/types";
import PasswordRenewalStatus from "./PasswordRenewalStatus";

export interface PasswordValueProps {
  password: components["schemas"]["DeviceSecretValue"];
}

export default function PasswordValue({ password }: PasswordValueProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password.secretValue);
      setCopied(true);
      setCopyError(null);
    } catch {
      setCopyError("Could not copy the password. Select and copy it manually.");
    }
  };

  return (
    <div className="pt-4 pb-4">
      <div className="mb-3 flex flex-row gap-2">
        <Input aria-label="Device password" className="flex-1" type="text" name="password-value" value={password.secretValue} readOnly />
        <Button onClick={() => { void handleCopy(); }}>{copied ? "Copied" : "Copy"}</Button>
      </div>
      {copyError && <InlineAlert className="mb-3">{copyError}</InlineAlert>}
      <PasswordRenewalStatus task={password.renewalTask ?? null} />
    </div>
  );
}
