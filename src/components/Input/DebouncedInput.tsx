import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Input } from "./FormElements";

export interface DebouncedInputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
}

export default function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  onKeyDown,
  className,
  ...props
}: DebouncedInputProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeoutRef.current);
  }, [value, debounce, onChange]);

  const handleClear = () => {
    clearTimeout(timeoutRef.current);
    setValue("");
    onChange("");
  };

  return (
    <div className="relative">
      <Input
        {...props}
        value={value}
        className={`${className ?? ""} pr-6`}
        onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
          setValue(ev.target.value)
        }
        onKeyDown={(ev: React.KeyboardEvent<HTMLInputElement>) => {
          if (ev.key === "Enter") {
            clearTimeout(timeoutRef.current);
            onChange(value);
          }
          onKeyDown?.(ev);
        }}
      />
      {value !== "" && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
