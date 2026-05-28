import * as React from "react";
import { RestrictedTooltip } from "@/components/ui/restricted-tooltip";
import { usePermissions } from "./use-permissions";
import type { PermissionKey } from "./permission-keys";

// Extra props the wrapper adds on top of the wrapped component props
type GuardExtras = {
  resourceType: string;
  resourceId?: string;
  permissionKey: PermissionKey;
  customNoPermissionsMessage?: string;
  /** If true, force disabled when show=true (merged with incoming disabled) */
  autoDisable?: boolean;
  /** Optional class on the span that wraps the child */
  wrapperClassName?: string;
};

/**
 * withPermissionRequiredTooltip
 * Generic over P = original component's props.
 * Returns a new component that accepts P & GuardExtras.
 */
export function withPermissionRequiredTooltip<P extends object>(
  Wrapped: React.ComponentType<P>
) {
  // Create the wrapper component
  function Comp({ resourceType, resourceId, permissionKey, customNoPermissionsMessage, autoDisable = true, wrapperClassName, ...rest }: P & GuardExtras) {

      const { hasPermission, noPermissionsMessage: generatedNoPermissionsMessage } = usePermissions({
         resourceType,
         resourceId,
         permissionKey
        });
    // Merge 'disabled' if the underlying component supports it
    const disabled =
      ("disabled" in (rest as any) ? (rest as any).disabled : false) ||
      (autoDisable && !hasPermission);

    return (
      <RestrictedTooltip show={!hasPermission} message={customNoPermissionsMessage ?? generatedNoPermissionsMessage}>
        {/* Wrapper span (lets you style layout and control pointer-events separately) */}
        <span className={wrapperClassName}>
          {/* Render the original component with all original props + merged disabled */}
          <Wrapped {...(rest as P)} {...(disabled ? { disabled } : {})} />
        </span>
      </RestrictedTooltip>
    );
  }

  // Nice display name for React DevTools
  Comp.displayName = `WithPermissionRequiredTooltip(${ 
    Wrapped.displayName || Wrapped.name || "Component"
  })`;

  return Comp;
}