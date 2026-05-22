import { TransferList } from "@/components/settings/TransferList";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";

export default function DeviceSettings() {

  const { templatesQuery, saveTemplatesMutation } = edgeConfigApiHooks.useDeviceTemplates();

  if (templatesQuery.isLoading) {
    return <div>Loading templates...</div>;
  }

  if (templatesQuery.isError) {
    return <div>Failed to load templates</div>;
  }

  const templates = templatesQuery.data || [];

  const selectedTemplates = templates
    .filter((t: any) => t.selected)
    .map((t: any) => t.name);

  const availableTemplates = templates
    .filter((t: any) => !t.selected)
    .map((t: any) => t.name);

  const handleAdd = (value: string) => {

  const updated = [...selectedTemplates, value];

  saveTemplatesMutation.mutate(updated, {
    onSuccess: () => {
      templatesQuery.refetch();
    }
  });
};

const handleRemove = (value: string) => {

  const updated = selectedTemplates.filter((t: string) => t !== value);

  saveTemplatesMutation.mutate(updated, {
    onSuccess: () => {
      templatesQuery.refetch();
    }
  });
};


  return (
    <div className="space-y-6">

      <h2 className="text-xl font-semibold">
        Device Templates
      </h2>

      <TransferList
        title=""
        selectedItems={selectedTemplates}
        availableItems={availableTemplates}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />
    </div>
  );
}
