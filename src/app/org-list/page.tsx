"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
// Enterprise search removed - using mock functions
const isCompanyExist = async (companyName: string) => ({ code: 404, exists: false });
const importCompanies = async (token: string, companyId: string) => ({ code: 200, data: [] });
const validateUser = async (token: string) => ({ code: 200, success: true, data: { userId: 'mock' } });
const addUser = async (userData: any, companyId: string, userId: string) => ({ code: 200, success: true });
import { toastInfo } from "@/components/toast-varients";
import { Button } from "@/components/ui/button";
import LoginSidePanel from "@/components/common/sso-login-side-panel";
import { useCompanyStore } from "@/stores/company-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { createGraphQLClient, queries } from "@/lib/supabase/graphql";

type Company = {
  color: string | undefined;
  companyId: string;
  name: string; // Changed from companyName to name for consistency
  role: string;
};

const COLORS = [
  "#7164FF", // purple
  "#FFD600", // yellow
  "#FF4A4A", // red
  "#34A853", // green
];

export default function OrgListPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { setSelectedCompany, setCompanies: setCompaniesInStore } = useCompanyStore();
  // const [selected, setSelected] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data: sessionData } = await supabase.auth.getSession();
        
        // Get user from Supabase Auth, not localStorage
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        if (!userId) {
          console.warn("No authenticated user found");
          return;
        }

        // Store in localStorage for backward compatibility
        if (typeof window !== "undefined") {
          localStorage.setItem("user_id", userId);
        }

        const gql = createGraphQLClient(sessionData.session?.access_token);

        // Fetch companies via GraphQL
        const res: any = await gql.request(queries.getUserCompanies, { userId });
        const edges = res?.user_companiesCollection?.edges || [];
        const mapped = edges.map((e: any) => ({
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          companyId: e.node.company?.id,
          name: e.node.company?.name, // Use 'name' consistently instead of 'companyName'
          role: e.node.role || "member", // Use lowercase to match type definitions
        })).filter((c: any) => c.companyId && c.name);

        setCompanies(mapped);
        setCompaniesInStore(mapped); // Store companies in Zustand store
        if (mapped.length > 0) {
          setSelectedCompanyId(mapped[0].companyId);
        }

        // Fetch user details via GraphQL
        const userDetailsRes: any = await gql.request(queries.getUserDetails, { userId });
        const node = userDetailsRes?.profilesCollection?.edges?.[0]?.node;
        if (node?.email) setUserEmail(node.email);
      } catch (error) {
        console.error("Error fetching companies or email:", error);
      }
    };
    fetchData();
  }, []);

  const handleContinueWithCompany = async () => {
    const selectedCompany = companies.find(
      (c) => c.companyId === selectedCompanyId
    );
    if (!selectedCompany) return;

    setIsLoading(true);
    try {
      // Set the selected company in the store
      setSelectedCompany({
        companyId: selectedCompany.companyId,
        name: selectedCompany.name, // Use 'name' consistently
        role: selectedCompany.role,
      });

      // Redirect to home
      router.push("/home");
    } catch (error) {
      console.error("Error selecting company:", error);
      toastInfo("Error", "Failed to select company. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen">
      {/* Left side */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-semibold text-center">Choose Account</h2>
          <p className="text-center text-gray-500 text-sm">
            {`Looks like there ${companies.length === 1 ? "is" : "are"} ${
              companies.length === 1 ? "an" : "a few"
            } account${companies.length === 1 ? "" : "s"} tied to `}
            <br />
            <span className="font-medium">
              {userEmail ? userEmail : "Loading email..."}
            </span>
          </p>

          <div className="space-y-3">
            {companies.map((company) => (
              <div
                // key={company.name}
                key={company.companyId}
                onClick={() => setSelectedCompanyId(company.companyId)}
                className={`flex items-center justify-between border rounded-lg px-4 py-2 cursor-pointer transition ${
                  selectedCompanyId === company.companyId
                    ? "border-[#7164FF]"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm`}
                    style={{ backgroundColor: company.color }}
                  >
                    {company.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{company.name}</p>
                    <p className="text-xs text-gray-500">{company.role}</p>
                  </div>
                </div>
                {selectedCompanyId === company.companyId && (
                  <svg
                    className="w-4 h-4 text-[#7164FF]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleContinueWithCompany}
            disabled={!selectedCompanyId || isLoading}
            className="w-full h-10 bg-[#7164FF] text-white font-medium rounded-md hover:bg-[#5b4fe0] transition cursor-pointer"
          >
            {isLoading ? "Preparing..." : "Continue"}
          </Button>
        </div>
      </div>
      <LoginSidePanel />
    </div>
  );
}
