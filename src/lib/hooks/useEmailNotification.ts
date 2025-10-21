import { useState } from 'react';
import { toast } from 'sonner';

interface EmailNotificationData {
  recipients?: string[];
  subject?: string;
  message?: string;
  notificationType?: string;
  [key: string]: any;
}

interface EmailNotificationResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const useEmailNotification = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendNotification = async (data: EmailNotificationData = {}) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/n8n-email-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: EmailNotificationResponse = await response.json();

      if (result.success) {
        toast.success(result.message || 'Email notification sent successfully!');
        return { success: true, data: result.data };
      } else {
        toast.error(result.message || 'Failed to send email notification');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(`Failed to send notification: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendNotification,
    isLoading,
  };
};
