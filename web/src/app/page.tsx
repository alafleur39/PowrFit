import { redirect } from "next/navigation";

// The app starts on Home; the (app) layout sends signed-out users to /login.
export default function RootPage() {
  redirect("/home");
}
