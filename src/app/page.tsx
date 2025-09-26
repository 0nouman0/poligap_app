import { redirect } from "next/navigation";

export default function RootRedirectPage() {
  // Immediately redirect root ("/") to the sign-in page
  redirect("/auth/signin");
}
