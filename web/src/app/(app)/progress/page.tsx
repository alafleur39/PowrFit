import { ScreenHeader } from "@/components/ui/screen-header";
import { ProgressView } from "@/components/workout/progress-view";

export default function ProgressPage() {
  return (
    <div>
      <ScreenHeader title="Progress" />
      <ProgressView />
    </div>
  );
}
