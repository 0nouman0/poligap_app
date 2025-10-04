# N8N Webhook Integration for Email Notifications

This document describes the integration of N8N workflow automation for email notifications in the Poligap platform.

## Overview

The N8N webhook integration allows the Poligap platform to trigger automated email workflows through N8N when users click the "Send Notifications" button in the Email Notifier Agent.

## Components

### 1. API Route (`/api/n8n-email-webhook`)

**File:** `src/app/api/n8n-email-webhook/route.ts`

- **Purpose:** Handles POST requests to trigger the N8N webhook
- **Endpoint:** `https://akashkamat10.app.n8n.cloud/webhook-test/f5a61878-f50d-4d3c-a589-c24a22b4a4db`
- **Method:** POST
- **Response:** JSON with success status and workflow data

### 2. Utility Functions

**File:** `src/lib/utils/n8n-webhook.ts`

- `triggerN8NEmailWorkflow()`: Main function to call the N8N webhook
- `EMAIL_TEMPLATES`: Predefined email templates for different notification types
- Type definitions for payload and response structures

### 3. Custom Hook

**File:** `src/lib/hooks/useEmailNotification.ts`

- React hook for managing email notification state
- Includes loading states and toast notifications
- Error handling and user feedback

### 4. Updated AI Agents Page

**File:** `src/app/(app)/ai-agents/page.tsx`

- Modified `sendNotifications()` function to use N8N webhook
- Integrated with existing Email Notifier Agent UI
- Maintains existing user experience while using new backend

## Usage

### From the Email Notifier Agent

1. Navigate to AI Agents page
2. Click "Use Agent" on the Email Notifier card
3. Go to the "Actions" tab
4. Add recipient emails
5. Select notification type
6. Click "Send Notifications"

The system will:
- Parse the email addresses
- Get the appropriate email template
- Call the N8N webhook with the payload
- Show success/failure feedback to the user

### Programmatic Usage

```typescript
import { triggerN8NEmailWorkflow } from '@/lib/utils/n8n-webhook';

const result = await triggerN8NEmailWorkflow({
  recipients: ['user@example.com'],
  subject: 'Test Email',
  message: 'This is a test message',
  actionType: 'policy_changes',
  notificationType: 'policy_changes'
});

if (result.success) {
  console.log('Email workflow triggered successfully');
} else {
  console.error('Failed to trigger workflow:', result.error);
}
```

## Payload Structure

The webhook receives the following payload:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "source": "poligap-email-notifier",
  "recipients": ["email1@example.com", "email2@example.com"],
  "subject": "Email Subject",
  "message": "Email body content",
  "actionType": "policy_changes",
  "notificationType": "policy_changes"
}
```

## Email Templates

The system includes predefined templates for:

- Policy Changes
- Terms & Conditions Updates
- Feature Launches
- Maintenance Notifications
- Security Advisories
- Newsletters
- Promotions
- Surveys
- Webinars
- Billing Updates

## Error Handling

- Network errors are caught and logged
- Failed webhook calls return appropriate error messages
- UI shows loading states and success/failure feedback
- Toast notifications inform users of the operation status

## Testing

A test component is available at `src/components/test-n8n-webhook.tsx` for verifying the integration works correctly.

## Configuration

The N8N webhook URL is currently hardcoded in the API route. For production deployment, consider:

1. Moving the URL to environment variables
2. Adding authentication if required by N8N
3. Implementing retry logic for failed requests
4. Adding request logging for monitoring

## Security Considerations

- The webhook URL should be kept secure
- Consider adding API key authentication
- Validate and sanitize all input data
- Implement rate limiting to prevent abuse
- Log all webhook calls for audit purposes
