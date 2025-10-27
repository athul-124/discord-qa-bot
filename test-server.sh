#!/bin/bash

# Start the server in the background
npm run dev:server > test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
echo "Health response: $HEALTH_RESPONSE"

# Test upload without auth
echo -e "\nTesting upload without auth (should fail)..."
NO_AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/upload-kb)
echo "Response code: $NO_AUTH_RESPONSE (expected 401)"

# Test upload with auth but no file
echo -e "\nTesting upload with auth but no file (should fail)..."
NO_FILE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:3000/upload-kb \
  -H "x-server-id: test-server-123" \
  -H "x-api-token: test-token")
echo "Response code: $NO_FILE_RESPONSE (expected 400)"

# Test successful CSV upload
echo -e "\nTesting CSV upload..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3000/upload-kb \
  -H "x-server-id: test-server-123" \
  -H "x-api-token: test-token" \
  -F "file=@sample-kb.csv")
echo "Upload response: $UPLOAD_RESPONSE"

# Kill the server
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo -e "\nTest completed!"
