"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCompanyStore } from "@/stores/company-store";

export default function ClearCachePage() {
  const router = useRouter();
  const { setCompanies, setSelectedCompany } = useCompanyStore();

  const handleClearCache = () => {
    // Clear company store
    setCompanies([]);
    setSelectedCompany({ companyId: "", name: "", role: "" });
    
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("company-store");
      localStorage.removeItem("user_id");
    }
    
    // Redirect to org-list to reload fresh data
    router.push("/org-list");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Clear Cache
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If you're seeing old company data ("kroolo 783" or "raj org"), 
            click the button below to clear cached data and reload fresh information.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>What this does:</strong>
            </p>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside mt-2 space-y-1">
              <li>Clears company cache</li>
              <li>Reloads organization list</li>
              <li>Shows current data from database</li>
            </ul>
          </div>

          <Button 
            onClick={handleClearCache}
            className="w-full"
            size="lg"
          >
            Clear Cache & Reload
          </Button>

          <Button 
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
