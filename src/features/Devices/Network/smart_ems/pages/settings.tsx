import { GoBack } from "../components/navigation/GoBack";
import { Authorization } from "../layouts/Authorization";
import { OpenVpn } from "../layouts/OpenVpn";

export function SmartEmsSettings() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex min-h-screen flex-1 flex-col gap-4 bg-muted/30 p-4 md:gap-8 md:p-10">
       <div className="mx-auto w-full max-w-6xl">
  <div className="flex items-center gap-4 border-b pb-4">
    <GoBack />
    <h1 className="text-2xl font-semibold tracking-tight">
      Smart EMS Settings
    </h1>
  </div>
</div>
      <div className="mx-auto w-full max-w-5xl">
  
  <div className="rounded-2xl bg-background border shadow-xs p-6 md:p-8 space-y-8">
    <Authorization />
    <OpenVpn />
  </div>
</div>
      </main>
    </div>
  );
}
