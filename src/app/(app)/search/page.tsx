"use client";

/**
 * Enterprise Search Page
 * 
 * ⚠️ CURRENTLY DISABLED - Requires Backend Configuration
 * 
 * This page requires:
 * - Django/FastAPI backend for search indexing
 * - Elasticsearch for full-text search
 * - External integrations backend (Google Drive, Slack, etc.)
 * 
 * To enable:
 * 1. Set up backend services
 * 2. Configure environment variables
 * 3. Restore search functionality
 */

import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Search } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="p-6 md:p-8 h-full flex items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Search className="h-24 w-24 text-gray-300" />
              <AlertCircle className="h-12 w-12 text-yellow-500 absolute -right-2 -bottom-2 bg-white rounded-full" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">
            Enterprise Search Not Configured
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The enterprise search feature requires external backend services that are not currently set up.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-left">
            <h3 className="font-semibold mb-3 text-yellow-900 dark:text-yellow-100">
              Required Services:
            </h3>
            <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Django/FastAPI Backend</strong> - For data ingestion and search API</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Elasticsearch</strong> - For full-text search indexing</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Integration Platform</strong> - For Google Drive, Slack, etc. connections</span>
              </li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            Contact your system administrator to enable this feature.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
