import { GymsView } from "@/components/gyms/gyms-view";
import { ScreenHeader } from "@/components/ui/screen-header";

export default function GymsPage() {
  return (
    <div>
      <ScreenHeader title="Gyms near you" />
      <GymsView />
    </div>
  );
}
