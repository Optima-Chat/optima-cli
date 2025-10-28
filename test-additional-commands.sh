#!/bin/bash

# Test additional command types (create, update, delete operations)

TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOWVhMWRmOS1jYTNmLTRmYWItYmJkNS02Y2Y1YTgzMDk3YmUiLCJhdWQiOlsiYWdlbnRpYy1jaGF0LXRsaW9ib29wIl0sInNjb3BlIjoicmVhZCBwcm9maWxlIiwiY2xpZW50X2lkIjoiYWdlbnRpYy1jaGF0LXRsaW9ib29wIiwicm9sZSI6Im1lcmNoYW50IiwiZW1haWwiOiJ4dWhhby5wcm9AZ21haWwuY29tIiwiZXhwIjoxNzYxNjY1NDMyLCJpYXQiOjE3NjE2NjQ1MzIsImlzcyI6Imh0dHBzOi8vYXV0aC5vcHRpbWEuc2hvcCIsImp0aSI6InRMMk1YUktmTXF6dThXb250cXhYVkgxbVZzRUpJekJaIn0.RE-0nTYP0lZbVp1-LZFyUUAM-NlnNhN8pnOW9v_OBYS8WhnVRCcIfxaPZ7ARToxSVobxUc5uEgsf6OdHAqozyYentfcnbraf6wvihtrSeIhMT_q4WH7z5ct0AvBVE215HK-M0lr4LThO6SBus3VqZj6x5taA21gE71mUAUC7un5VisVHF-KMgexU6sV7bZLsshyr8xujecEW3cYhNl38HPWiAcE6KAbkbJEmqJQMGLvNC9AvNjfV3q6V8IqJeoQg0LfnF1J7iKHziTfRgmQd9HO-xcCYofigwb4tEZqZh8Lc6Ku4smf5q5z-1KaqxtTy_9JajTXSihInJ4LQxrkMOw"

PASS=0
FAIL=0

test_json() {
  local name="$1"
  shift
  local cmd="$@"

  echo -n "Testing $name... "
  result=$(OPTIMA_TOKEN="$TOKEN" $cmd 2>&1)

  if echo "$result" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅"
    PASS=$((PASS + 1))
  else
    echo "❌"
    echo "  Output: $result" | head -5
    FAIL=$((FAIL + 1))
  fi
}

echo "========================================"
echo "Additional Commands JSON Output Test"
echo "========================================"

echo -e "\n📝 WRITE OPERATIONS"
test_json "category create" node dist/index.js category create --name "测试JSON" --json
test_json "product update" node dist/index.js product update --id 76995876-ec10-4160-81d7-aff2bdbf89e7 --price 0.12 --json
test_json "merchant update" node dist/index.js merchant update --name "徐昊的全球小店" --json

echo -e "\n📊 DETAILED QUERIES"
test_json "inventory history" node dist/index.js inventory history --id 76995876-ec10-4160-81d7-aff2bdbf89e7 --json
test_json "order get" node dist/index.js order get --id 19bd1cc2-debf-4f75-a4f6-76d20701ce65 --json

echo -e "\n🌐 I18N OPERATIONS"
test_json "i18n product list" node dist/index.js i18n product list --product-id 76995876-ec10-4160-81d7-aff2bdbf89e7 --json
test_json "i18n merchant list" node dist/index.js i18n merchant list --json

echo -e "\n========================================"
echo "Results: $PASS passed, $FAIL failed"
echo "========================================"
