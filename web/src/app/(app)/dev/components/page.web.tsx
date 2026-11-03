import { notFound } from "next/navigation";

import { ComponentGallery } from "@/components/dev/component-gallery";

// Every shared component in every state (UI playbook Phase 2), for
// screenshots and review. Development only: a .web.tsx page, so the iOS
// build never has it, and a 404 in production builds of the website.
export default function ComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ComponentGallery />;
}
