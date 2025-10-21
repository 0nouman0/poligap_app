import { redirect } from "next/navigation";

// Revalidate every 1 hour (static redirect page)
export const revalidate = 3600;

export default function RootRedirectPage() {
  // Immediately redirect root ("/") to the sign-in page
  redirect("/auth/signin");
}
