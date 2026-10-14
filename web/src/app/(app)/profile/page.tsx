import { EmptyState, ScreenHeader } from "@/components/shell/placeholder";

export default function ProfilePage() {
  return (
    <div>
      <ScreenHeader title="Profile" subtitle="Account and training summary." />
      <EmptyState
        title="Profile coming soon"
        hint="Your stats, achievements, and settings will live here. Use the avatar menu to sign out for now."
      />
    </div>
  );
}
