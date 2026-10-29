import logo from "../assets/sealman_logo.png";

export default function ComingNextPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-6 rounded-xl border bg-background px-10 py-12 text-center shadow-xs">
        <img className="h-14 w-auto object-contain" src={logo} alt="Sealman IoT" />
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            Coming next
          </span>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
