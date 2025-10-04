"use client";

import { useState } from 'react';
import { triggerN8NEmailWorkflow } from '@/lib/utils/n8n-webhook';
import { Button } from '@/components/ui/button';

export function TestN8NWebhook() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testWebhook = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const response = await triggerN8NEmailWorkflow({
        recipients: ['test@example.com'],
        subject: 'Test Email from Poligap',
        message: 'This is a test email sent from the Poligap platform to verify n8n webhook integration.',
        actionType: 'test',
        notificationType: 'test'
      });
      
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Test N8N Webhook Integration</h3>
      
      <Button 
        onClick={testWebhook} 
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? 'Testing...' : 'Test N8N Webhook'}
      </Button>
      
      {result && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Response:</h4>
          <pre className="bg-white p-3 rounded border text-sm overflow-auto max-h-64">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
