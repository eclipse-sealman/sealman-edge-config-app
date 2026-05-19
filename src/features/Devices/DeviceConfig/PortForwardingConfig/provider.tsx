import { useEffect, useState } from "react";
import { PortForwardingContext } from "./context";
import { PortForwardingConfig, PortForwardingRule } from "./types";
import { useGetPortForwardingConfig } from "./useGetPortForwardingConfig";

export default function PortForwardingConfigProvider({
  children,
  deviceId,
}: {
  children: React.ReactNode;
  deviceId: string;
}) {
  const [config, setConfig] = useState<PortForwardingConfig>();
  const { data } = useGetPortForwardingConfig(deviceId);
  

  useEffect(() => {
  if (data) {
  setConfig({
    rules: data.rules ?? [],
  });
}
}, [data]);

  const addRule = (rule: PortForwardingRule) => {
    setConfig(prev =>
      prev ? { ...prev, rules: [...(prev.rules ?? []), rule] } : prev
    );
  };

  const updateRule = (index: number, rule: PortForwardingRule) => {
    setConfig(prev => {
      if (!prev) return prev;
      const rules = [...prev.rules];
      rules[index] = rule;
      return { ...prev, rules };
    });
  };

  const deleteRule = (index: number) => {
    setConfig(prev => {
      if (!prev) return prev;
      const rules = [...prev.rules];
      rules.splice(index, 1);
      return { ...prev, rules };
    });
  };

  return (
    <PortForwardingContext.Provider
      value={{ config, setConfig, addRule, updateRule, deleteRule }}
    >
      {children}
    </PortForwardingContext.Provider>
  );
}
