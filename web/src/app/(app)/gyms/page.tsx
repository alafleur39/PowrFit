import { GymsView } from "@/components/gyms/gyms-view";
import { ScreenHeader } from "@/components/shell/placeholder";

export default function GymsPage() {
  return (
    <div>
      <ScreenHeader title="Gyms near you" subtitle="Cheapest monthly price first." />
      <GymsView />
    </div>
  );
}
