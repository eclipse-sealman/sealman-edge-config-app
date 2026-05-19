interface SidebarButtonProps {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}

export function SidebarNavButton({ label, active, onClick }: SidebarButtonProps) {
  return (
    <button
      className="flex items-center justify-center space-x-2 w-full"
      onClick={onClick}
    >
      <div
        className={`flex items-center justify-center space-x-2 w-full hover:cursor-pointer text-muted-foreground hover:text-vibrant-blue rounded-md${active ? " bg-vibrant-blue/95" : ""}`}
      >
        <p
          className={`px-2 flex min-h-[36px] rounded-md items-center${active ? " text-white bg-vibrant-blue/95" : ""}`}
        >
          {label}
        </p>
      </div>
    </button>
  );
}