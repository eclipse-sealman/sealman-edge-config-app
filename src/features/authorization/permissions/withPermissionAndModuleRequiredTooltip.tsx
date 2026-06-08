import * as React from "react";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { RestrictedTooltip } from "@/components/ui/restricted-tooltip";
import { usePermissions } from "./use-permissions";
import type { PermissionKey } from "./permission-keys";

type GuardExtras = {
  resourceType: string;
  deviceId?: string;
  permissionKey: PermissionKey;
  customNoPermissionsMessage?: string;
  autoDisable?: boolean;
  wrapperClassName?: string;
};

type RequiredModuleExtras = {
  deviceId?: string;
  requiredModuleName?: string;
  missingModuleMessage?: string;
  disconnectedModuleMessage?: string;
  checkingModuleMessage?: string;
};

const DEFAULT_CHECKING_MESSAGE = "Checking required module...";

export function withPermissionAndModuleRequiredTooltip<P extends object>(
  Wrapped: React.ComponentType<P>
) {
  function Comp({
    resourceType,
    deviceId,
    permissionKey,
    customNoPermissionsMessage,
    autoDisable = true,
    wrapperClassName,
    requiredModuleName,
    missingModuleMessage,
    disconnectedModuleMessage,
    checkingModuleMessage = DEFAULT_CHECKING_MESSAGE,
    ...rest
  }: P & GuardExtras & RequiredModuleExtras) {
    const { hasPermission, noPermissionsMessage: generatedNoPermissionsMessage } = usePermissions({
      resourceType,
      deviceId,
      permissionKey,
    });

    const moduleDeviceId = deviceId;
    const shouldCheckModule = hasPermission && Boolean(moduleDeviceId && requiredModuleName);

    const { data: modules, isLoading, isError } = edgeConfigApiHooks.useGetModules(moduleDeviceId, {
      enabled: shouldCheckModule,
    });

    const matchingModule = shouldCheckModule
      ? modules?.find((module) => module.moduleName === requiredModuleName)
      : undefined;

    const isModulePresent = shouldCheckModule ? Boolean(matchingModule) : true;
    const isModuleConnected = shouldCheckModule
      ? matchingModule?.connectionState === "Connected"
      : true;

    const isModuleMissing = shouldCheckModule && !isLoading && !isError && !isModulePresent;
    const isModuleDisconnected = shouldCheckModule && !isLoading && !isError && isModulePresent && !isModuleConnected;

    const moduleDisableReason = isLoading
      ? checkingModuleMessage
      : isModuleMissing
        ? (missingModuleMessage ?? `This action requires module '${requiredModuleName}' to be installed on this device.`)
        : isModuleDisconnected
          ? (disconnectedModuleMessage ?? `This action requires module '${requiredModuleName}' to be in Connected state.`)
        : undefined;

    const tooltipMessage = hasPermission
      ? moduleDisableReason
      : (customNoPermissionsMessage ?? generatedNoPermissionsMessage);

    const shouldDisable = Boolean(!hasPermission || moduleDisableReason);

    const disabled =
      (("disabled" in (rest as Record<string, unknown>)
        ? Boolean((rest as Record<string, unknown>).disabled)
        : false) ||
      (autoDisable && shouldDisable));

    return (
      <RestrictedTooltip show={Boolean(tooltipMessage)} message={tooltipMessage}>
        <span className={wrapperClassName}>
          <Wrapped {...(rest as P)} {...(disabled ? { disabled } : {})} />
        </span>
      </RestrictedTooltip>
    );
  }

  Comp.displayName = `WithPermissionAndModuleRequiredTooltip(${Wrapped.displayName || Wrapped.name || "Component"})`;

  return Comp;
}
