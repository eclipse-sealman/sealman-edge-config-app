import PageTitle from "@/components/Typography/PageTitle";

export default function Version() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <PageTitle title="Version" />
        <div className="rounded-lg border bg-background p-6 text-sm shadow-xs">
          <span className="text-muted-foreground">Version </span>
          <span className="font-medium">{import.meta.env.VITE_VERSION || "local_development"}</span>
        </div>
      </div>
    </div>
  );
}
