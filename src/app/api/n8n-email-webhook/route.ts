import { NextRequest, NextResponse } from 'next/server';

// N8N Webhook URLs - try production first, fallback to test
const N8N_PRODUCTION_URL = 'https://akashkamat10.app.n8n.cloud/webhook/f5a61878-f50d-4d3c-a589-c24a22b4a4db';
const N8N_TEST_URL = 'https://akashkamat10.app.n8n.cloud/webhook-test/f5a61878-f50d-4d3c-a589-c24a22b4a4db';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || N8N_PRODUCTION_URL;

export async function POST(request: NextRequest) {
  try {
    console.log('N8N Webhook API called');
    
    // Parse the request body to get any data to send to n8n
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Prepare the payload for n8n webhook in the format expected by your workflow
    const payload: any = {
      timestamp: new Date().toISOString(),
      source: 'poligap-email-notifier',
      query: {
        'email-list': body.recipients ? body.recipients.join(', ') : '',
        subject: body.subject || '',
        body: body.message || ''
      },
      // Keep original data for reference
      originalData: body
    };

    // If frontend asked to suppress branding, promote the flag to top-level so n8n can read $json.no_branding
    if (body && typeof body.no_branding !== 'undefined') {
      payload.no_branding = body.no_branding;
    }
    
    console.log('Payload to send to N8N:', JSON.stringify(payload, null, 2));
    console.log('N8N Webhook URL:', N8N_WEBHOOK_URL);

    // Try calling the webhook with fallback mechanism
    let response: Response;
    let lastError: string = '';
    
    try {
      // First try the configured URL (production by default)
      console.log('Attempting to call N8N webhook...');
      console.log('Using URL:', N8N_WEBHOOK_URL);
      console.log('Payload size:', JSON.stringify(payload).length, 'bytes');

      response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Poligap-Webhook-Client/1.0',
        },
        body: JSON.stringify(payload),
      });

      console.log('N8N Response status:', response.status);
      console.log('N8N Response headers:', Object.fromEntries(response.headers.entries()));

      // If the configured URL returned 404 and looks like a "test" path, try the non-test (production) path
      if (!response.ok && response.status === 404 && N8N_WEBHOOK_URL.includes('/webhook-test/')) {
        const altUrl = N8N_WEBHOOK_URL.replace('/webhook-test/', '/webhook/');
        try {
          console.log(`Initial webhook returned 404; attempting alternate webhook path: ${altUrl}`);
          const altResp = await fetch(altUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          console.log('Alternate webhook response status:', altResp.status);
          // If alternate worked, use it
          if (altResp.ok) {
            response = altResp;
          } else {
            // capture alt error for diagnostics
            try {
              lastError = await altResp.text();
            } catch (e) {
              lastError = 'Could not read alt response';
            }
          }
        } catch (e) {
          console.log('Alternate webhook attempt failed:', e instanceof Error ? e.message : e);
        }
      }

      // If production URL fails with 404, try test URL as fallback (existing behavior)
      if (!response.ok && response.status === 404 && N8N_WEBHOOK_URL === N8N_PRODUCTION_URL) {
        console.log('Production webhook failed, trying test webhook...');
        // Clone response to read error text without consuming the original
        const responseClone = response.clone();
        try {
          lastError = await responseClone.text();
        } catch (e) {
          lastError = 'Could not read error response';
        }

        console.log('Calling test webhook URL:', N8N_TEST_URL);
        response = await fetch(N8N_TEST_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log('Test webhook response status:', response.status);
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('N8N webhook error response:', errorText);

      // If the webhook is not registered/active, return a structured client-friendly response
      if (response.status === 404 && errorText.includes('not registered')) {
        const clientPayload = {
          success: false,
          message: 'N8N webhook is not active or not registered. Activate the workflow in n8n (click "Execute workflow" in the editor) or enable the webhook, then try again.',
          details: {
            status: response.status,
            raw: errorText,
          },
        };

        return NextResponse.json(clientPayload, { status: 422 });
      }

      // For other non-OK responses return a 502-like structured response so the frontend can handle it gracefully
      const clientPayload = {
        success: false,
        message: `N8N webhook failed with status: ${response.status}`,
        details: {
          status: response.status,
          raw: errorText,
        },
      };

      return NextResponse.json(clientPayload, { status: 502 });
    }

    let result;
    try {
      // Clone response before reading to avoid consuming it
      const responseClone = response.clone();
      result = await response.json();
      console.log('N8N Response data:', JSON.stringify(result, null, 2));
    } catch (jsonError) {
      console.log('Response is not JSON, reading as text...');
      try {
        // Use the cloned response if available, otherwise try to read as text
        const textResult = await response.text();
        console.log('N8N Response (text):', textResult);
        result = { message: textResult };
      } catch (textError) {
        console.log('Could not read response as text either');
        result = { message: 'Response received but could not be parsed' };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email notification workflow triggered successfully',
      data: result,
    }, { status: 200 });

  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    
    // More detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    };
    
    console.error('Full error details:', errorDetails);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to trigger email notification workflow',
      error: errorDetails.message,
      details: errorDetails,
    }, { status: 500 });
  }
}

// Optional: Add GET method for testing
export async function GET() {
  try {
    // Test if the n8n webhook is accessible
    const testResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
        source: 'poligap-test',
      }),
    });

    return NextResponse.json({
      message: 'N8N Email Webhook API is running',
      webhookUrl: N8N_WEBHOOK_URL,
      webhookTest: {
        accessible: testResponse.ok,
        status: testResponse.status,
        statusText: testResponse.statusText,
      },
    });
  } catch (error) {
    return NextResponse.json({
      message: 'N8N Email Webhook API is running',
      webhookUrl: N8N_WEBHOOK_URL,
      webhookTest: {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
