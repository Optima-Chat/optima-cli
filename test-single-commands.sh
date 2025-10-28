#!/bin/bash

# Single command tests

export OPTIMA_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOWVhMWRmOS1jYTNmLTRmYWItYmJkNS02Y2Y1YTgzMDk3YmUiLCJhdWQiOlsiYWdlbnRpYy1jaGF0LXRsaW9ib29wIl0sInNjb3BlIjoicmVhZCBwcm9maWxlIiwiY2xpZW50X2lkIjoiYWdlbnRpYy1jaGF0LXRsaW9ib29wIiwicm9sZSI6Im1lcmNoYW50IiwiZW1haWwiOiJ4dWhhby5wcm9AZ21haWwuY29tIiwiZXhwIjoxNzYxNjY3MjM3LCJpYXQiOjE3NjE2NjYzMzcsImlzcyI6Imh0dHBzOi8vYXV0aC5vcHRpbWEuc2hvcCIsImp0aSI6IkdwZEtrMER6YUNCZTVuRWpjaWtDQ2R1SWdLWDMxeVBrIn0.gnK5H1TCf-CDQkwhS9-GFXn9v3bY4A3rvgbN70TsxdwHYAA1LtHlmk3X8PQ0tZZxRHAMMPOukfP-LyjZU5ExBZw73t-6fJvCuLfE31KPrbL2pmC6doAkLKRt72K3ZQN4628cC40UsMAOeYZnsyN4F7bkWrwq1RtNo2-wxyFwRlL3wLkFlIt9uWRyKWTkkmklwvXuj4wuu6RsKgnOxyX_mGwLkI5WM6Vb3ctuWEYNyd3z_EAUGit2-axNHG2RQhV-4kuBIb9H_XECeCfftb--b65Q43e8OCb4ytARxa7RaDWj7G5RkIFAH0N69g1R6Smgxy42qdANNr_t4QsPj4nesA"

echo "=== Testing CRUD Operations with JSON Output ==="
echo ""

# Test product create
echo "1. Testing product create:"
result=$(node dist/index.js product create --title "JSON测试商品" --price 99 --stock 10 --json 2>&1)
if echo "$result" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ product create returns valid JSON"
  product_id=$(echo "$result" | jq -r '.data.product_id')
  echo "   Product ID: $product_id"
else
  echo "❌ product create failed"
  echo "$result" | head -5
fi
echo ""

# Test category create
echo "2. Testing category create:"
result=$(node dist/index.js category create --name "JSON测试分类" --json 2>&1)
if echo "$result" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ category create returns valid JSON"
  category_id=$(echo "$result" | jq -r '.data.category.id')
  echo "   Category ID: $category_id"
else
  echo "❌ category create failed"
  echo "$result" | head -5
fi
echo ""

# Test variant create (if we have a product_id)
if [ -n "$product_id" ] && [ "$product_id" != "null" ]; then
  echo "3. Testing variant create:"
  result=$(node dist/index.js variant create --product-id "$product_id" --sku "TEST-SKU" --price 99 --stock 5 --json 2>&1)
  if echo "$result" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ variant create returns valid JSON"
    variant_id=$(echo "$result" | jq -r '.data.variant.id')
    echo "   Variant ID: $variant_id"
  else
    echo "❌ variant create failed"
    echo "$result" | head -5
  fi
  echo ""
fi

# Test i18n product create
if [ -n "$product_id" ] && [ "$product_id" != "null" ]; then
  echo "4. Testing i18n product create:"
  result=$(node dist/index.js i18n product create --product-id "$product_id" --lang zh-CN --name "测试产品" --description "这是测试" --json 2>&1)
  if echo "$result" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ i18n product create returns valid JSON"
  else
    echo "❌ i18n product create failed"
    echo "$result" | head -5
  fi
  echo ""

  # Test i18n product get
  echo "5. Testing i18n product get:"
  result=$(node dist/index.js i18n product get --product-id "$product_id" --lang zh-CN --json 2>&1)
  if echo "$result" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ i18n product get returns valid JSON"
  else
    echo "⚠️  i18n product get (may not exist)"
  fi
  echo ""
fi

# Test i18n category create
if [ -n "$category_id" ] && [ "$category_id" != "null" ]; then
  echo "6. Testing i18n category create:"
  result=$(node dist/index.js i18n category create --category-id "$category_id" --lang ja-JP --name "テストカテゴリー" --json 2>&1)
  if echo "$result" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ i18n category create returns valid JSON"
  else
    echo "❌ i18n category create failed"
    echo "$result" | head -5
  fi
  echo ""
fi

# Cleanup
echo "=== Cleanup ==="
if [ -n "$variant_id" ] && [ "$variant_id" != "null" ]; then
  echo "Deleting variant..."
  node dist/index.js variant delete --product-id "$product_id" --id "$variant_id" --yes --json > /dev/null 2>&1
fi

if [ -n "$product_id" ] && [ "$product_id" != "null" ]; then
  echo "Deleting i18n product translation..."
  node dist/index.js i18n product delete --product-id "$product_id" --lang zh-CN --yes --json > /dev/null 2>&1

  echo "Deleting product..."
  node dist/index.js product delete --id "$product_id" --yes --json > /dev/null 2>&1
fi

if [ -n "$category_id" ] && [ "$category_id" != "null" ]; then
  echo "Deleting i18n category translation..."
  node dist/index.js i18n category delete --category-id "$category_id" --lang ja-JP --yes --json > /dev/null 2>&1

  echo "Deleting category..."
  node dist/index.js category delete --id "$category_id" --yes --json > /dev/null 2>&1
fi

echo "✅ Cleanup complete"
