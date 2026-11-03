"use client";

import { LogOut, MessageSquare, Shield } from "lucide-react";

import { useSignOut } from "@/components/app-shell";

import { DeleteAccount } from "@/components/profile/delete-account";
import { ProfileCard } from "@/components/profile/profile-card";
import { ListGroup, ListRow } from "@/components/ui/list-row";
import { ScreenHeader } from "@/components/ui/screen-header";

/** The beta feedback form (D30). Unset: the button isn't shown. */
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL?.startsWith("https://")
  ? process.env.NEXT_PUBLIC_FEEDBACK_URL
  : undefined;

// Profile (P5-05, P6-13; UI playbook Phase 4): who you are, your all-time
// numbers and settings, then Help and Account sections like iOS Settings.
export default function ProfilePage() {
  const signOut = useSignOut();
  return (
    <div className="pb-10">
      <ScreenHeader title="Profile" />
      <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 sm:px-6">
        <ProfileCard />
        <ListGroup title="Help" className="mt-3">
          {FEEDBACK_URL && (
            <ListRow
              href={FEEDBACK_URL}
              external
              icon={<MessageSquare />}
              title="Send feedback"
              description="Bugs, ideas, anything confusing. Opens a short form."
            />
          )}
          <ListRow href="/privacy" icon={<Shield />} title="Privacy" description="What PowrFit stores and why." />
        </ListGroup>

        {/* Account deletion stays one tap from Profile (App Store rule), and confirms. */}
        <ListGroup title="Account">
          <ListRow icon={<LogOut />} title="Sign out" onClick={signOut} />
          <DeleteAccount />
        </ListGroup>
      </div>
    </div>
  );
}
