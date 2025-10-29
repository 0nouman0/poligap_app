# Portkey File Upload Implementation

## Overview

This implementation uses Portkey's file management API to handle document uploads in the chat interface. Instead of parsing documents locally, files are uploaded directly to Portkey and referenced in chat completions, allowing the AI to access and analyze the actual file content.

## User Experience Flow

### Step-by-Step UX

1. **Upload File**: User clicks the "Upload" button and selects a file
2. **File Attached**: File appears in the chatbox with filename and size
3. **Type Query**: User types their specific question about the file
4. **Send**: User clicks send button
5. **Processing**: File is uploaded to Portkey and analyzed with the user's query
6. **Response**: AI streams back the answer based on the actual file content

### Key UX Features

- **Visual Feedback**: Attached file is displayed with name and size
- **Custom Queries**: Users can ask specific questions about the file
- **Easy Removal**: Users can remove the attachment before sending
- **Dynamic Placeholder**: Input placeholder changes to prompt questions about the file
- **No Auto-Send**: Files are not sent until the user is ready

## Architecture

### Flow Diagram

```
User clicks Upload button → File attached to chatbox (not sent yet)
                           ↓
User types query about file → User clicks Send
                           ↓
                           POST /api/ai-chat/upload-file (file + query)
                           ↓
                           Extract file content using Portkey + GPT-4o vision
                           ↓
                           Combine file content + user query into single message
                           ↓
                           Send to Portkey chat completion API
                           ↓
                           Stream response back to frontend
                           ↓
                           Display in chat bubbles
```

## Components

### 1. Document Parser (`src/lib/parsers/portkey-document-parser.ts`)

Extracts content from uploaded files using Portkey with GPT-4o:

- **`parseDocumentWithPortkey()`** - Extracts text, summary, and key points from documents
- Uses GPT-4o vision API for PDFs and images
- Supports PDF, DOCX, images, and text files
- Returns structured data: content, summary, key points, document type
- More reliable than Gemini (no API version issues)

### 2. Upload API Route (`src/app/api/ai-chat/upload-file/route.ts`)

Handles file upload requests:

1. **Authentication** - Verifies user session
2. **Validation** - Checks file size (max 50MB) and type
3. **Content Extraction** - Uses Portkey with GPT-4o to extract file content
4. **Message Fusion** - Combines file content + user query into single message
5. **Chat Completion** - Sends fused message to Portkey for streaming response
6. **Response** - Streams AI response back to client

### 3. Frontend Components

#### ChatInput Component (`src/app/(app)/chat/components/ChatInput/ChatInput.tsx`)
- Handles file selection via upload button
- Sends file to API endpoint
- Processes streaming response

#### ChatArea Component (`src/app/(app)/chat/components/ChatArea.tsx`)
- Handles drag & drop file uploads
- Same upload flow as ChatInput

## API Integration

### Content Extraction with Portkey

The file content is first extracted using Portkey with GPT-4o vision API:

```typescript
const parseResult = await parseDocumentWithPortkey(file);
// Returns: { success, content, summary, keyPoints, documentType, error? }
```

**Why Portkey Parser:**
- Uses GPT-4o vision API for excellent PDF and image handling
- More reliable than Gemini (no API version issues)
- Only requires PORTKEY_API_KEY (no additional API keys)
- Better error handling and fallbacks

### Fused Message Approach

The file content and user query are combined into a single, comprehensive message:

```typescript
const combinedMessage = `I have uploaded a document titled "${file.name}". Here is the complete content of the document:

--- BEGIN DOCUMENT CONTENT ---
${parseResult.content}
--- END DOCUMENT CONTENT ---

Document Summary: ${parseResult.summary}

Document Type: ${parseResult.documentType}

Key Points:
${parseResult.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

Now, based on this document, please answer the following question:

${userQuery}`;
```

### Chat Completion with Fused Message

```typescript
const messages = [
  {
    role: "user",
    content: combinedMessage  // File content + query in one message
  }
];

const stream = await portkey.chat.completions.create({
  model: 'gpt-4o',
  messages: messages,
  stream: true,
});
```

## Supported File Types

- **Documents:** PDF, DOC, DOCX
- **Text:** TXT, CSV, Markdown
- **Images:** JPEG, PNG, GIF, WebP, BMP, TIFF

## Configuration

### Environment Variables

```env
PORTKEY_API_KEY=your_portkey_api_key
```

### Virtual Keys

The implementation uses OpenAI virtual key for file support:
```typescript
const portkey = createPortkeyClient('openai');
```

## Benefits

### 1. Fused Context
- File content and query combined in single message
- No confusion about what to explain
- AI has complete context in one place

### 2. Accurate Extraction
- GPT-4o vision API extracts clean, readable text
- Excellent handling of PDFs and images
- Handles various file formats (PDF, DOCX, images, text)
- Provides summary and key points
- More reliable than Gemini (no API issues)

### 3. Custom Queries
- Users ask specific questions about their files
- No generic "analyze this file" responses
- Targeted, relevant answers

### 4. Streaming Responses
- Real-time response display
- Better user experience
- Progressive content loading

## Error Handling

The implementation handles various error scenarios:

1. **Upload Failures** - Returns error if Portkey upload fails
2. **Invalid Files** - Validates file type and size before upload
3. **API Errors** - Catches and reports Portkey API errors
4. **Streaming Errors** - Handles chunk processing failures

## Event Types

The API emits three event types:

### RunResponseContent
Sent during streaming with partial content:
```json
{
  "event": "RunResponseContent",
  "content": "Partial response text...",
  "created_at": 1234567890,
  "file_id": "file-abc123"
}
```

### RunResponseComplete
Sent when response is complete:
```json
{
  "event": "RunResponseComplete",
  "content": "Complete response text",
  "created_at": 1234567890,
  "file_id": "file-abc123"
}
```

### RunResponseError
Sent when an error occurs:
```json
{
  "event": "RunResponseError",
  "error": "Error message",
  "created_at": 1234567890
}
```

## Usage Example

### Frontend (Upload Button)
```typescript
// Step 1: User clicks upload button - file is attached (not sent)
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  setAttachedFile(file); // Store in state
  toastSuccess(`File attached: ${file.name}. Type your query and send.`);
};

// Step 2: User types query and clicks send
const handleSubmit = async () => {
  if (attachedFile) {
    const query = inputMessage.trim();
    const formData = new FormData();
    formData.append('file', attachedFile);
    formData.append('user_query', query); // User's custom query
    formData.append('conversation_id', conversationId);

    const response = await fetch('/api/ai-chat/upload-file', {
      method: 'POST',
      body: formData,
    });

    // Handle streaming response
    const reader = response.body?.getReader();
    // ... process stream
  }
};
```

### Backend (API Route)
```typescript
// Extract file content with Portkey + GPT-4o
const parseResult = await parseDocumentWithPortkey(file);

// Fuse file content with user query
const combinedMessage = `I have uploaded a document titled "${file.name}". Here is the complete content of the document:

--- BEGIN DOCUMENT CONTENT ---
${parseResult.content}
--- END DOCUMENT CONTENT ---

Document Summary: ${parseResult.summary}

Now, based on this document, please answer the following question:

${userQuery}`;

// Create chat with fused message
const messages = [{
  role: "user",
  content: combinedMessage  // File content + query together
}];

// Stream response
const chatStream = await portkey.chat.completions.create({
  model: 'gpt-4o',
  messages: messages,
  stream: true,
});
```

## Limitations

1. **Provider Support** - Currently uses OpenAI provider for file support
2. **File Size** - Maximum 50MB per file
3. **Single File** - Only one file per upload (can be extended)
4. **File Persistence** - Files remain in Portkey until manually deleted

## Future Enhancements

1. **Multi-file Support** - Upload and analyze multiple files simultaneously
2. **File Management UI** - View and manage uploaded files
3. **File Caching** - Cache frequently accessed files
4. **Provider Fallback** - Try multiple providers if one fails
5. **File Preprocessing** - OCR for scanned documents, image enhancement

## Troubleshooting

### File Upload Fails
- Check PORTKEY_API_KEY is set correctly
- Verify file size is under 50MB
- Ensure file type is supported

### Gibberish Responses
- **Fixed:** Now using Portkey file attachments instead of local parsing
- AI accesses actual file content, not parsed text

### Streaming Errors
- Check network connectivity
- Verify Portkey API is accessible
- Check browser console for detailed errors

## Testing

To test the implementation:

1. Navigate to `/chat` in the application
2. Click the upload button or drag & drop a file
3. Enter a query about the file (e.g., "Summarize this document")
4. Verify the streaming response appears in chat bubbles
5. Check that the response is relevant to the actual file content

## References

- [Portkey Files API Documentation](https://portkey.ai/docs/api-reference/files)
- [OpenAI File Attachments](https://platform.openai.com/docs/assistants/tools/file-search)
- [Portkey Chat Completions](https://portkey.ai/docs/api-reference/chat-completions)
