"use client";

// This page relies on client-side auth and environment values; avoid static prerendering
export const dynamic = "force-dynamic";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthenticationStore from "@/stores/authentication";
import { handleCognitoLogin } from "./actions";

export default function SsoCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (code) {
      // 👉 User is coming back from Cognito with ?code
      const callBackendCallback = async () => {
        try {
          const response = await handleCognitoLogin(code);

          if (response.success) {
            const { AccessToken, RefreshToken, userData } = response;

            useAuthenticationStore.setState((state) => ({
              ...state,
              user: userData?.userId,
              accessToken: AccessToken,
              refreshToken: RefreshToken,
            }));

            localStorage.setItem("accessToken", AccessToken);
            localStorage.setItem("__LOGIN_SESSION__", AccessToken);
            localStorage.setItem("refreshToken", RefreshToken);
            localStorage.setItem("user_id", `${userData?.userId}`);

            router.push("/org-list");
          } else {
            console.error("Failed to complete SSO callback");
            router.push("/auth/signin");
          }
        } catch (error) {
          console.error("Error:", error);
          router.push("/auth/signin");
        }
      };

      callBackendCallback();
    }
    // If no code param, go back to signin
    else {
      router.push("/auth/signin");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-600">Processing SSO login...</p>
    </div>
  );
}
