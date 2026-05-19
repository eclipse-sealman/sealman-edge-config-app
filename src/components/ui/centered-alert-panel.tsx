import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

type CenteredAlertPanelProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
  variant?: "danger" | "warning";
};

const variantStyles = {
  danger: {
    panel: "bg-red-50 border-red-200",
    iconWrap: "bg-red-100",
    icon: "text-red-600",
    title: "text-red-700",
    content: "text-red-600",
  },
  warning: {
    panel: "bg-amber-50 border-amber-200",
    iconWrap: "bg-amber-100",
    icon: "text-amber-600",
    title: "text-amber-700",
    content: "text-amber-700",
  },
} as const;

export const CenteredAlertPanel: React.FC<CenteredAlertPanelProps> = ({
  title,
  children,
  className = "",
  variant = "danger",
}) => {
  const styles = variantStyles[variant];
  const Icon = variant === "warning" ? AlertTriangle : ShieldAlert;

  return (
    <div className={`flex items-center justify-center h-full w-full ${className}`}>
      <div
        className={`flex flex-col items-center text-center border rounded-2xl p-6 shadow-xs max-w-md ${styles.panel}`}
      >
        <div className={`flex items-center justify-center w-16 h-16 rounded-full mb-4 ${styles.iconWrap}`}>
          <Icon className={`w-8 h-8 ${styles.icon}`} />
        </div>
        <h2 className={`text-lg font-semibold mb-2 ${styles.title}`}>{title}</h2>
        <div className={`text-sm leading-relaxed ${styles.content}`}>{children}</div>
      </div>
    </div>
  );
};