#!/bin/bash

echo "Testing Title Generation API"
echo "============================="
echo ""

# Test 1: Valid prompt
echo "Test 1: Valid prompt"
curl -X POST http://localhost:3000/api/ai-chat/generate-title \
  -H "Content-Type: application/json" \
  -d '{"userPrompt": "How do I set up a React component with TypeScript and hooks?"}' \
  -w "\n\n"

echo ""
echo "Test 2: Empty prompt"
curl -X POST http://localhost:3000/api/ai-chat/generate-title \
  -H "Content-Type: application/json" \
  -d '{"userPrompt": ""}' \
  -w "\n\n"

echo ""
echo "Test 3: Missing prompt"
curl -X POST http://localhost:3000/api/ai-chat/generate-title \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\n\n"

echo ""
echo "Test 4: Complex prompt"
curl -X POST http://localhost:3000/api/ai-chat/generate-title \
  -H "Content-Type: application/json" \
  -d '{"userPrompt": "I need help debugging my Next.js application that is having issues with server-side rendering and hydration errors when I use Zustand stores"}' \
  -w "\n\n"
