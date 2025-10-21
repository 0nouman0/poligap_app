"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export function N8NTroubleshoot() {
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<{
    accessible: boolean;
    status?: number;
    error?: string;
  } | null>(null);

  const checkWebhookStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/n8n-email-webhook', {
        method: 'GET',
      });
      const data = await response.json();
      setStatus(data.webhookTest);
    } catch (error) {
      setStatus({
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = () => {
    if (!status) return <AlertCircle className="h-4 w-4" />;
    if (status.accessible) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusMessage = () => {
    if (!status) return 'Click "Check Status" to test the N8N webhook connection';
    if (status.accessible) return 'N8N webhook is accessible and ready to receive requests';
    if (status.status === 404) return 'N8N webhook is not registered. Please activate your workflow in N8N.';
    return `N8N webhook error: ${status.error || 'Unknown error'}`;
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <span>🔧</span> N8N Webhook Troubleshooting
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button 
            onClick={checkWebhookStatus} 
            disabled={isChecking}
            size="sm"
            variant="outline"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Check Status'
            )}
          </Button>
          
          <div className="flex items-center gap-2 text-sm">
            {getStatusIcon()}
            <span>{getStatusMessage()}</span>
          </div>
        </div>

        {status && !status.accessible && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Webhook Issue Detected</strong></p>
                {status.status === 404 ? (
                  <div className="space-y-1">
                    <p>The N8N webhook is not registered. To fix this:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Go to your N8N workflow canvas</li>
                      <li>Click the <strong>"Execute workflow"</strong> button (play icon)</li>
                      <li>The webhook will be registered and ready to receive requests</li>
                      <li>For permanent availability, activate the workflow in production mode</li>
                    </ol>
                  </div>
                ) : (
                  <p>Error: {status.error}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {status && status.accessible && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Webhook is working!</strong> Your N8N workflow is ready to receive email notification requests.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <p><strong>Quick Tips:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Test webhooks require manual activation after each use</li>
          <li>Production webhooks stay active once the workflow is published</li>
          <li>Check your N8N workflow is saved and properly configured</li>
        </ul>
      </div>
    </div>
  );
}
