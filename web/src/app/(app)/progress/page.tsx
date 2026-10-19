import { ScreenHeader } from "@/components/shell/placeholder";
import { ProgressView } from "@/components/workout/progress-view";

export default function ProgressPage() {
  return (
    <div>
      <ScreenHeader title="Progress" />
      <ProgressView />
    </div>
  );
}
