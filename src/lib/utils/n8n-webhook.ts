interface N8NWebhookPayload {
  recipients?: string[];
  subject?: string;
  message?: string;
  actionType?: string;
  notificationType?: string;
  [key: string]: any;
}

interface N8NWebhookResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Utility function to trigger n8n email notification workflow
 * @param payload - Data to send to the n8n webhook
 * @returns Promise with the response from the webhook
 */
export async function triggerN8NEmailWorkflow(payload: N8NWebhookPayload): Promise<N8NWebhookResponse> {
  try {
    console.log('Triggering N8N workflow with payload:', payload);
    
    // Add a no_branding flag to request that n8n not append its automatic footer/signature.
    // The n8n workflow must be updated to honor this flag (see instructions returned to the user).
    const requestBody = {
      no_branding: true,
      timestamp: new Date().toISOString(),
      source: 'poligap-frontend',
      ...payload,
    };

    const response = await fetch('/api/n8n-email-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('API Response status:', response.status);

    // Try to parse the response body (JSON preferred)
    let parsed: any = null;
    const text = await response.text();
    try {
      parsed = JSON.parse(text || '{}');
    } catch (e) {
      parsed = { message: text };
    }

    if (!response.ok) {
      console.error('API Error response:', parsed);
      // If server returned a structured error, pass it through
      if (parsed && typeof parsed === 'object' && 'success' in parsed) {
        return parsed as N8NWebhookResponse;
      }

      return {
        success: false,
        message: parsed?.message || `HTTP error: ${response.status}`,
        error: parsed?.error || `HTTP ${response.status}`,
        data: parsed?.data,
      } as N8NWebhookResponse;
    }

    const result: N8NWebhookResponse = parsed as N8NWebhookResponse;
    console.log('API Success response:', result);
    return result;
  } catch (error) {
    console.error('Error triggering n8n workflow:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      message: 'Failed to trigger email workflow',
      error: errorMessage,
    };
  }
}

/**
 * Predefined email templates for different notification types
 */
export const EMAIL_TEMPLATES = {
  policy_changes: {
    subject: "Important: Policy Changes",
    body: "We have updated our policies. Please review the changes at your earliest convenience.",
  },
  terms_updates: {
    subject: "Update: Terms & Conditions",
    body: "Our Terms & Conditions have been updated. Visit your account to read the new terms.",
  },
  feature_launch: {
    subject: "New Feature Launch 🚀",
    body: "We're excited to announce a new feature now available in your workspace.",
  },
  maintenance: {
    subject: "Scheduled Maintenance",
    body: "We will perform scheduled maintenance during the listed window.",
  },
  downtime: {
    subject: "Incident: Service Downtime",
    body: "We experienced downtime. The issue has been resolved. Details inside.",
  },
  security: {
    subject: "Security Advisory",
    body: "A security-related update requires your attention.",
  },
  newsletter: {
    subject: "Monthly Newsletter",
    body: "Catch up on product updates, tips, and resources.",
  },
  promotion: {
    subject: "Limited-time Promotion",
    body: "Unlock special discounts available for a short time.",
  },
  survey: {
    subject: "We value your feedback",
    body: "Please take a quick survey to help us improve.",
  },
  webinar: {
    subject: "You're invited: Webinar",
    body: "Join our upcoming webinar. Save your seat now!",
  },
  billing: {
    subject: "Billing Update",
    body: "There has been an update to your billing information or invoice.",
  },
} as const;

export type EmailTemplateType = keyof typeof EMAIL_TEMPLATES;
