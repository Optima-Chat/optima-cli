#!/bin/bash

# JSON Output Test Script
# Tests all commands with --json flag

TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOWVhMWRmOS1jYTNmLTRmYWItYmJkNS02Y2Y1YTgzMDk3YmUiLCJhdWQiOlsiYWdlbnRpYy1jaGF0LXRsaW9ib29wIl0sInNjb3BlIjoicmVhZCBwcm9maWxlIiwiY2xpZW50X2lkIjoiYWdlbnRpYy1jaGF0LXRsaW9ib29wIiwicm9sZSI6Im1lcmNoYW50IiwiZW1haWwiOiJ4dWhhby5wcm9AZ21haWwuY29tIiwiZXhwIjoxNzYxNjY1NDMyLCJpYXQiOjE3NjE2NjQ1MzIsImlzcyI6Imh0dHBzOi8vYXV0aC5vcHRpbWEuc2hvcCIsImp0aSI6InRMMk1YUktmTXF6dThXb250cXhYVkgxbVZzRUpJekJaIn0.RE-0nTYP0lZbVp1-LZFyUUAM-NlnNhN8pnOW9v_OBYS8WhnVRCcIfxaPZ7ARToxSVobxUc5uEgsf6OdHAqozyYentfcnbraf6wvihtrSeIhMT_q4WH7z5ct0AvBVE215HK-M0lr4LThO6SBus3VqZj6x5taA21gE71mUAUC7un5VisVHF-KMgexU6sV7bZLsshyr8xujecEW3cYhNl38HPWiAcE6KAbkbJEmqJQMGLvNC9AvNjfV3q6V8IqJeoQg0LfnF1J7iKHziTfRgmQd9HO-xcCYofigwb4tEZqZh8Lc6Ku4smf5q5z-1KaqxtTy_9JajTXSihInJ4LQxrkMOw"

PASS=0
FAIL=0
TOTAL=0

test_command() {
  local name="$1"
  local cmd="$2"

  TOTAL=$((TOTAL + 1))
  echo -n "Testing $name... "

  result=$(eval "OPTIMA_TOKEN=\"$TOKEN\" $cmd 2>&1")
  exit_code=$?

  # Check if output is valid JSON and has success field
  if echo "$result" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅"
    PASS=$((PASS + 1))
  else
    echo "❌"
    echo "  Output: $result"
    FAIL=$((FAIL + 1))
  fi
}

echo "========================================"
echo "JSON Output Test - All Commands"
echo "========================================"

echo -e "\n📦 1. MERCHANT MODULE"
test_command "merchant info" "node dist/index.js merchant info --json"
test_command "merchant url" "node dist/index.js merchant url --json"

echo -e "\n📦 2. PRODUCT MODULE"
test_command "product list" "node dist/index.js product list --limit 2 --json"
test_command "product get" "node dist/index.js product get --id 76995876-ec10-4160-81d7-aff2bdbf89e7 --json"

echo -e "\n📦 3. CATEGORY MODULE"
test_command "category list" "node dist/index.js category list --json"

echo -e "\n📦 4. VARIANT MODULE"
test_command "variant list" "node dist/index.js variant list --product-id 76995876-ec10-4160-81d7-aff2bdbf89e7 --json"

echo -e "\n📦 5. ORDER MODULE"
test_command "order list" "node dist/index.js order list --limit 2 --json"

echo -e "\n📦 6. INVENTORY MODULE"
test_command "inventory low-stock" "node dist/index.js inventory low-stock --threshold 100 --json"

echo -e "\n📦 7. SHIPPING-ZONE MODULE"
test_command "shipping-zone list" "node dist/index.js shipping-zone list --json"

echo -e "\n📦 8. CONVERSATION MODULE"
test_command "conversation list" "node dist/index.js conversation list --json"

echo -e "\n📦 9. TRANSFER MODULE"
test_command "transfer list" "node dist/index.js transfer list --json"
test_command "transfer summary" "node dist/index.js transfer summary --json"

echo -e "\n📦 10. I18N MODULE"
test_command "i18n languages" "node dist/index.js i18n languages --json"

echo -e "\n📦 11. AUTH MODULE"
test_command "auth whoami" "node dist/index.js auth whoami --json"

echo -e "\n========================================"
echo "Test Results: $PASS/$TOTAL passed, $FAIL failed"
echo "========================================"

if [ $FAIL -eq 0 ]; then
  echo "🎉 All tests passed!"
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi
