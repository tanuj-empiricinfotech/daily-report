#!/bin/bash

# Test script for Teams webhook notification
# Usage: ./test-teams-webhook.sh [WEBHOOK_URL] [DATE]

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
API_URL="http://localhost:3000/api/teams/test-summary"
DATE="${2:-$(date +%Y-%m-%d)}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Teams Webhook Test Script${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if webhook URL is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Webhook URL is required${NC}"
  echo ""
  echo "Usage: $0 <WEBHOOK_URL> [DATE]"
  echo ""
  echo "Examples:"
  echo "  $0 'https://webhook.office.com/...' 2024-01-04"
  echo "  $0 'https://defaultad8b165177824309a7738b4fddfeab.9f.environment.api.powerplatform.com/...' 2024-01-04"
  echo ""
  exit 1
fi

WEBHOOK_URL="$1"

# Check if the server is running
echo -e "\n${BLUE}Checking if backend server is running...${NC}"
if ! curl -s -f "http://localhost:3000/api/health" > /dev/null 2>&1; then
  echo -e "${RED}Error: Backend server is not running on http://localhost:3000${NC}"
  echo "Please start the server with: cd backend && npm run dev"
  exit 1
fi

echo -e "${GREEN}Server is running${NC}"

# Get authentication token (you'll need to replace this with actual login)
echo -e "\n${BLUE}Note: Make sure you have a valid authentication token${NC}"
echo -e "${BLUE}You can get a token by logging in through the API${NC}"

# Prompt for token
read -p "Enter your authentication token (Bearer token): " AUTH_TOKEN

if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${RED}Error: Authentication token is required${NC}"
  exit 1
fi

# Make the request
echo -e "\n${BLUE}Sending test request...${NC}"
echo -e "Date: ${GREEN}${DATE}${NC}"
echo -e "Webhook URL: ${GREEN}${WEBHOOK_URL}${NC}"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"date\": \"$DATE\",
    \"webhookUrl\": \"$WEBHOOK_URL\"
  }")

echo -e "${BLUE}Response:${NC}"
echo "$RESPONSE" | jq . || echo "$RESPONSE"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}Test completed!${NC}"
echo -e "${BLUE}Check the server logs for detailed output${NC}"
echo -e "${BLUE}========================================${NC}"
