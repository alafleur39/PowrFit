"use client";

import { MessageSquare, Shield } from "lucide-react";

import { DeleteAccount } from "@/components/profile/delete-account";
import { ProfileCard } from "@/components/profile/profile-card";
import { ListGroup, ListRow } from "@/components/ui/list-row";
import { ScreenHeader } from "@/components/ui/screen-header";

/** The beta feedback form (D30). Unset: the button isn't shown. */
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL?.startsWith("https://")
  ? process.env.NEXT_PUBLIC_FEEDBACK_URL
  : undefined;

// Profile (P5-05, P6-13): who you are and your lifetime numbers, then
// feedback, privacy and deleting the account.
export default function ProfilePage() {
  return (
    <div className="pb-10">
      <ScreenHeader title="Profile" />
      <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 sm:px-6">
        <ProfileCard />
        <div className="mt-3" />
        <ListGroup>
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

        <section aria-labelledby="danger-zone" className="mt-6 flex flex-col gap-2">
          <h2 id="danger-zone" className="text-footnote font-bold">
            Delete account
          </h2>
          <p className="text-footnote text-muted-foreground">
            Removes your workouts, routines, settings and login for good.
          </p>
          <DeleteAccount />
        </section>
      </div>
    </div>
  );
}
