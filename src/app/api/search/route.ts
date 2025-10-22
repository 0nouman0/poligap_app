import { NextRequest, NextResponse } from "next/server";

/**
 * Elasticsearch Search API Route
 * 
 * ⚠️ CURRENTLY NOT CONFIGURED - Requires Elasticsearch backend
 * 
 * This endpoint proxies search requests to Elasticsearch.
 * To enable, configure these environment variables:
 * 
 * Option 1 (Simple):
 * - ELASTICSEARCH_URL: Full URL with index (e.g., https://your-es:9200/index-name/_search)
 * 
 * Option 2 (Composed):
 * - ELASTICSEARCH_BASE_URL: Base URL (e.g., https://your-es:9200)
 * - ELASTICSEARCH_INDEX: Index name (e.g., my-index)
 * 
 * Authentication (choose one):
 * - ELASTICSEARCH_API_KEY: For Elastic Cloud ApiKey auth
 * - ELASTICSEARCH_BASIC_AUTH: For Basic auth (format: "user:pass")
 */

export async function POST(req: NextRequest) {
  try {
    const { query, user_email, external_user_id, account_ids, apps } = await req.json();

    // Resolve ES endpoint: prefer explicit ELASTICSEARCH_URL, otherwise compose
    const explicitUrl = process.env.ELASTICSEARCH_URL;
    const baseUrl = process.env.ELASTICSEARCH_BASE_URL;
    const index = process.env.ELASTICSEARCH_INDEX;
    const composedUrl = baseUrl && index ? `${baseUrl.replace(/\/$/, "")}/${index}/_search` : undefined;
    const esUrl = explicitUrl || composedUrl;

    if (!esUrl) {
      return NextResponse.json(
        { error: "Elasticsearch endpoint not configured. Set ELASTICSEARCH_URL or ELASTICSEARCH_BASE_URL + ELASTICSEARCH_INDEX." },
        { status: 500 }
      );
    }

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // Example simple ES query: full-text with a few fields and basic filters
    const esBody: any = {
      size: 25,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: [
                  "title^3",
                  "content^2",
                  "content_preview^2",
                  "author_email",
                  "integration_type",
                ],
                type: "best_fields",
                operator: "and",
              },
            },
          ],
          filter: [
            account_ids?.length ? { terms: { account_id: account_ids } } : undefined,
            apps?.length ? { terms: { integration_type: apps } } : undefined,
          ].filter(Boolean),
        },
      },
      highlight: {
        fields: { content: {}, title: {} },
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (process.env.ELASTICSEARCH_API_KEY) {
      // Elastic Cloud expects ApiKey scheme with a base64 API key value
      headers["Authorization"] = `ApiKey ${process.env.ELASTICSEARCH_API_KEY}`;
    } else if (process.env.ELASTICSEARCH_BASIC_AUTH) {
      headers["Authorization"] = `Basic ${Buffer.from(
        process.env.ELASTICSEARCH_BASIC_AUTH,
        "utf8"
      ).toString("base64")}`;
    }

    const esResp = await fetch(esUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(esBody),
    });

    const data = await esResp.json();
    if (!esResp.ok) {
      return NextResponse.json(
        { error: data?.error || "Elasticsearch query failed" },
        { status: esResp.status }
      );
    }

    const hits = Array.isArray(data?.hits?.hits) ? data.hits.hits : [];

    const results = hits.map((h: any) => {
      const src = h._source || {};
      // Fallbacks to keep UI robust
      const title = src.title || src.file_name || src.name || "Untitled";
      const content_preview =
        (data?.highlight?.content && data.highlight.content[0]) ||
        src.content_preview ||
        (typeof src.content === "string" ? src.content.slice(0, 260) : "");

      return {
        id: h._id || src.id || crypto.randomUUID(),
        title,
        content_preview,
        file_url: src.file_url || src.url || "#",
        author_email: src.author_email || src.owner || "",
        integration_type: src.integration_type || src.app || "",
        relevance_score: h._score || 0,
        sync_status: true,
        updated_at: src.updated_at || src.modified_at || null,
        account_id: src.account_id || "",
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("/api/search error", err);
    return NextResponse.json(
      { error: "Unexpected error while searching" },
      { status: 500 }
    );
  }
}
