import { EmptyState, ScreenHeader } from "@/components/shell/placeholder";

export default function LogPage() {
  return (
    <div>
      <ScreenHeader title="Log workout" />
      <EmptyState title="Logger coming next" hint="Start a preset or an empty workout here." />
    </div>
  );
}
