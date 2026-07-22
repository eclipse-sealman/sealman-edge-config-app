export default function Toggle({
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
