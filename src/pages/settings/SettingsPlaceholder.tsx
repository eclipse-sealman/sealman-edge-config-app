import PageTitle from "@/components/Typography/PageTitle";

export default function SettingsPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <PageTitle title={title} description={description} />
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-background px-6 py-16 text-center">
        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Coming soon
        </span>
        <p className="text-sm text-muted-foreground">This configuration area is a placeholder and will be available in an upcoming release.</p>
      </div>
    </div>
  );
}
