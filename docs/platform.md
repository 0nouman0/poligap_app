# Poligap Platform Documentation

## Platform Overview
Poligap is an AI-powered enterprise compliance and contract management platform designed to help organizations analyze policies, review contracts, and ensure regulatory compliance across multiple industry standards.

## Core Features

### 1. Contract Review & Analysis
Intelligent contract analysis with AI-powered suggestions and comprehensive risk assessment.

**Capabilities:**
- Upload contracts in PDF, DOCX, or TXT format (max 20MB)
- AI analyzes contracts against best practices and templates
- Real-time suggestions categorized by severity (low, medium, high, critical)
- Risk assessment with detailed scoring
- Support for multiple contract types: NDA, SLA, Employment Agreement, Service Agreement, etc.
- Accept, reject, or modify AI suggestions
- Track changes and export analyzed contracts

**Workflow:**
1. Navigate to Contract Review page
2. Upload contract document (PDF/DOCX/TXT)
3. Select contract type from templates
4. AI analyzes document (10-30 seconds)
5. Review suggestions in editor
6. Accept/reject/modify suggestions
7. Export final document with tracked changes

**AI Models Used:** GPT-4o, Claude 3.5 Sonnet, Llama 3.3 70B (via Portkey)

### 2. Compliance Analysis
Automated policy compliance checking against major industry standards.

**Supported Standards:**
- **GDPR** - General Data Protection Regulation (EU data privacy)
- **HIPAA** - Health Insurance Portability and Accountability Act (healthcare)
- **SOC 2** - Service Organization Control 2 (security controls)
- **ISO 27001** - Information Security Management
- **PCI DSS** - Payment Card Industry Data Security Standard
- **CCPA** - California Consumer Privacy Act

**Capabilities:**
- Upload policy documents (PDF, DOCX up to 20MB)
- Select single or multiple compliance standards
- AI generates compliance score (0-100)
- Identifies gaps and missing requirements
- Provides actionable recommendations
- Highlights critical issues
- Detailed findings with strengths and weaknesses
- RuleBase integration for custom organizational rules

**Workflow:**
1. Navigate to Compliance Check page
2. Upload policy document
3. Select compliance standards (GDPR, HIPAA, etc.)
4. Enable RuleBase for custom rules (optional)
5. Submit for analysis
6. Review compliance score and findings
7. Address identified gaps
8. Export compliance report

**RuleBase Feature:**
- Create custom compliance rules per organization
- Rules stored in Supabase database
- Apply during analysis for specific requirements
- Each rule has name, description, and active status

### 3. AI Chat Assistant
Interactive AI assistant for compliance, contract, and platform questions.

**Available Models:**
- **GPT-4o** - Premium model for complex queries (OpenAI)
- **GPT-4o-mini** - Fast, cost-effective model (OpenAI)
- **Claude 3.5 Sonnet** - Advanced reasoning (Anthropic via AWS)
- **Llama 3.3 70B** - Open-source alternative (Groq)
- **Auto** - Intelligent routing based on query complexity

**Features:**
- Multi-turn conversations with context retention (last 20 messages)
- Session management with conversation IDs
- Streaming responses for real-time interaction
- Rate limiting: 10 requests per minute per user
- Conversation history saved per user
- Generate conversation titles automatically
- Export chat history
- Create, continue, and delete conversations

**Usage:**
1. Navigate to Chat page
2. Select AI model (or use auto-routing)
3. Type question or query
4. Receive streaming response
5. Continue conversation with context
6. View conversation history in sidebar

**Technology:** Powered by Portkey AI gateway with intelligent routing and automatic failover

### 4. Document Extraction
Robust text extraction from various document formats.

**Supported Formats:**
- PDF files (using pdf-parse library)
- DOCX files (using mammoth library)
- TXT files (plain text)
- MD files (markdown)

**Capabilities:**
- Extract text from PDFs (including complex layouts)
- Handle DOCX documents with formatting
- Clean and normalize extracted text
- Support for large documents (up to 20MB)
- Multi-provider AI fallback for complex documents
- Error handling for scanned/encrypted documents

**Limitations:**
- Scanned documents (images) have limited extraction
- Password-protected documents not supported
- Some complex PDF layouts may not extract perfectly

### 5. Audit Logs
Complete activity tracking for compliance and auditing purposes.

**Tracked Information:**
- User ID and session details
- Document name and type
- Analysis timestamp
- Compliance standards applied
- Analysis results and scores
- RuleBase application status
- Model used for analysis

**Features:**
- View all past analyses
- Filter by user, date, or standard
- Export audit logs for compliance reporting
- Activity monitoring and tracking

### 6. Additional Features

**Policy Generator:**
- AI-powered policy generation from scratch
- Templates for specific compliance standards
- Customizable policy content
- Export in multiple formats

**Copyright Detector:**
- Scan documents for copyrighted content
- Identify potential infringement risks
- Compliance recommendations

**Idea Analyzer:**
- Analyze business ideas for compliance
- Identify legal risks and requirements
- Regulatory compliance suggestions

## Technical Stack

### Frontend
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **UI Library:** React 18
- **Styling:** TailwindCSS + shadcn/ui components
- **Icons:** Lucide React
- **State Management:** React hooks and context

### Backend
- **Runtime:** Node.js
- **API:** Next.js API routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth with JWT
- **File Storage:** Supabase Storage
- **Document Parsing:** pdf-parse, mammoth

### AI Integration
- **Gateway:** Portkey AI (multi-provider routing)
- **Providers:**
  - OpenAI (GPT-4o, GPT-4o-mini)
  - Anthropic (Claude 3.5 Sonnet via AWS Bedrock)
  - Groq (Llama 3.3 70B)
  - Google (Gemini as fallback)
- **Features:** Intelligent routing, automatic failover, cost optimization
- **Streaming:** Server-Sent Events (SSE) for real-time responses

### Database Schema

**Main Tables:**
- `chat_conversations` - Chat sessions and metadata
- `chat_messages` - Individual messages with user queries and AI responses
- `document_analysis` - Analysis results and scores
- `rulebase` - User-defined compliance rules
- `portkey_config` - AI provider configuration
- `users` - User profiles and authentication data

**Security:**
- Row-Level Security (RLS) enabled on all tables
- User data isolation
- JWT-based authentication
- Secure file upload handling

## API Endpoints

### Chat APIs
- `POST /api/ai-chat/stream-chat` - Stream chat responses with SSE
- `POST /api/ai-chat/create-chat` - Create new conversation
- `GET /api/ai-chat/get-selected-chat` - Retrieve conversation history
- `POST /api/ai-chat/generate-title` - Auto-generate conversation title

### Analysis APIs
- `POST /api/contract-analyze` - Analyze contract documents
- `POST /api/compliance-analysis` - Analyze policy compliance
- `POST /api/extract-document` - Extract text from documents
- `GET /api/audit-logs` - Retrieve audit log entries
- `POST /api/audit-logs` - Save new audit log entry

### Utility APIs
- `POST /api/policy-generator/generate` - Generate compliance policies
- `POST /api/copyright-detector` - Detect copyright issues
- `POST /api/idea-analyzer/analyze` - Analyze business ideas

## File Size and Format Limits

**Maximum File Size:** 20MB per document

**Supported Formats:**
- PDF (application/pdf)
- DOCX (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- DOC (application/msword)
- TXT (text/plain)
- MD (text/markdown)

**Unsupported:**
- Scanned documents (images only, no text layer)
- Password-protected/encrypted files
- Corrupted or malformed documents

## Rate Limits

**Chat API:** 10 requests per minute per user
**Analysis APIs:** No hard limit, but subject to AI provider quotas
**File Uploads:** 20MB maximum per file

## Configuration

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `PORTKEY_API_KEY` - Portkey AI gateway API key
- `NEXT_PUBLIC_SITE_URL` - Application base URL

### Optional Environment Variables
- `GEMINI_API_KEY` - Google Gemini API key (fallback)
- `OPENAI_API_KEY` - Direct OpenAI access (fallback)

## User Workflows

### Contract Review Complete Workflow
1. Click "Contract Review" in navigation
2. Click "Upload Contract" button
3. Select PDF/DOCX file (max 20MB)
4. Choose contract type (NDA, SLA, etc.)
5. Wait for AI analysis (10-30 seconds)
6. Review suggestions in editor:
   - Green highlights = additions
   - Red highlights = deletions
   - Yellow highlights = modifications
7. Click suggestions to accept/reject/modify
8. Export final document with changes

### Compliance Analysis Complete Workflow
1. Click "Compliance Check" in navigation
2. Click "Upload Document" button
3. Select policy document (PDF/DOCX, max 20MB)
4. Select one or more standards (GDPR, HIPAA, etc.)
5. Toggle "Apply RuleBase" if you have custom rules
6. Click "Analyze" button
7. Wait for analysis (15-45 seconds)
8. Review results:
   - Overall compliance score (0-100)
   - Identified gaps
   - Recommendations
   - Critical issues
9. Export compliance report

### Chat Assistant Workflow
1. Click "Chat" in navigation
2. Select AI model from dropdown (or use "Auto")
3. Type your question in input box
4. Press Enter or click Send
5. Watch streaming response appear in real-time
6. Continue conversation - context is maintained
7. Create new conversation from sidebar
8. View/delete past conversations

## Best Practices

### For Document Upload
1. Ensure documents are text-based (not scanned images)
2. Keep file size under 20MB
3. Use PDF or DOCX for best results
4. Avoid password-protected files
5. Check document isn't corrupted before upload

### For Compliance Analysis
1. Select all relevant standards for comprehensive analysis
2. Create RuleBase rules for organization-specific requirements
3. Upload complete policy documents (not excerpts)
4. Review all critical issues first
5. Export reports for stakeholder review

### For Chat Usage
1. Use "Auto" model selection for best results
2. Be specific in your questions
3. Provide context in follow-up questions
4. Create new conversations for different topics
5. Review conversation history for reference

### For Administrators
1. Regularly rotate API keys
2. Monitor usage and costs via Portkey dashboard
3. Review audit logs for compliance
4. Configure Supabase backups
5. Track AI provider performance

## Known Limitations

**Document Processing:**
- Scanned documents (images) have limited text extraction
- Complex PDF layouts may not extract perfectly
- Password-protected documents not supported
- Maximum file size: 20MB

**Chat:**
- Rate limit: 10 requests per minute per user
- Context window: Last 20 messages
- Maximum output: 8,000-16,000 tokens depending on model

**Analysis:**
- Processing time varies: 10-60 seconds depending on document size
- AI analysis quality depends on document clarity
- Some specialized legal terms may need clarification

**Platform:**
- Web-only (no mobile app yet)
- No real-time collaboration features
- Single-user sessions only

## Security & Privacy

**Data Security:**
- All data encrypted at rest and in transit (TLS/SSL)
- Row-Level Security (RLS) in Supabase
- User data completely isolated
- No data sharing with third parties without consent

**AI Provider Privacy:**
- Data processed according to provider privacy policies
- OpenAI, Anthropic, Groq have enterprise-grade security
- No training on user data (per provider agreements)

**Compliance:**
- GDPR compliant infrastructure
- HIPAA compliant (Supabase)
- SOC 2 Type II (in progress)

## Support & Help

**Getting Help:**
- Use in-app Chat Assistant for platform questions
- Check documentation at `/docs`
- Contact support for enterprise features
- Review audit logs for activity tracking

**Common Questions:**

**Q: What file formats can I upload?**
A: PDF, DOCX, DOC, TXT, and MD files up to 20MB.

**Q: Which compliance standards are supported?**
A: GDPR, HIPAA, SOC 2, ISO 27001, PCI DSS, and CCPA.

**Q: How long does analysis take?**
A: Typically 10-60 seconds depending on document size and complexity.

**Q: Can I use my own AI models?**
A: Currently, models are managed via Portkey. Contact support for custom integrations.

**Q: Is my data secure?**
A: Yes, all data is encrypted and isolated with Row-Level Security. We follow industry best practices.

**Q: What's the difference between AI models?**
A: GPT-4o is best for complex analysis, Claude for reasoning, Llama for cost-effectiveness. "Auto" selects the best model for your query.

## Glossary

- **Portkey** - AI gateway that routes requests to multiple providers with failover
- **Supabase** - Backend-as-a-Service platform providing database, auth, and storage
- **RuleBase** - Custom compliance rules specific to your organization
- **SSE** - Server-Sent Events for real-time streaming responses
- **RLS** - Row-Level Security for database access control
- **Compliance Score** - 0-100 rating of policy compliance against standards
- **Gap Analysis** - Identification of missing compliance requirements
- **Virtual Key** - Portkey abstraction for AI provider credentials
- **Contract Suggestion** - AI-generated recommendation for contract improvement
- **Audit Log** - Record of all analysis activities for compliance tracking
