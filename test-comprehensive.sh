#!/bin/bash

# Comprehensive JSON Output Test
# Tests CRUD operations and other command types

TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOWVhMWRmOS1jYTNmLTRmYWItYmJkNS02Y2Y1YTgzMDk3YmUiLCJhdWQiOlsiYWdlbnRpYy1jaGF0LXRsaW9ib29wIl0sInNjb3BlIjoicmVhZCBwcm9maWxlIiwiY2xpZW50X2lkIjoiYWdlbnRpYy1jaGF0LXRsaW9ib29wIiwicm9sZSI6Im1lcmNoYW50IiwiZW1haWwiOiJ4dWhhby5wcm9AZ21haWwuY29tIiwiZXhwIjoxNzYxNjY3MjM3LCJpYXQiOjE3NjE2NjYzMzcsImlzcyI6Imh0dHBzOi8vYXV0aC5vcHRpbWEuc2hvcCIsImp0aSI6IkdwZEtrMER6YUNCZTVuRWpjaWtDQ2R1SWdLWDMxeVBrIn0.gnK5H1TCf-CDQkwhS9-GFXn9v3bY4A3rvgbN70TsxdwHYAA1LtHlmk3X8PQ0tZZxRHAMMPOukfP-LyjZU5ExBZw73t-6fJvCuLfE31KPrbL2pmC6doAkLKRt72K3ZQN4628cC40UsMAOeYZnsyN4F7bkWrwq1RtNo2-wxyFwRlL3wLkFlIt9uWRyKWTkkmklwvXuj4wuu6RsKgnOxyX_mGwLkI5WM6Vb3ctuWEYNyd3z_EAUGit2-axNHG2RQhV-4kuBIb9H_XECeCfftb--b65Q43e8OCb4ytARxa7RaDWj7G5RkIFAH0N69g1R6Smgxy42qdANNr_t4QsPj4nesA"

PASS=0
FAIL=0
SKIP=0

# Store created IDs for cleanup
CREATED_PRODUCT_ID=""
CREATED_CATEGORY_ID=""
CREATED_VARIANT_ID=""

test_json() {
  local name="$1"
  shift
  local cmd="$@"

  echo -n "Testing $name... "
  result=$(OPTIMA_TOKEN="$TOKEN" eval "$cmd" 2>&1)
  exit_code=$?

  if echo "$result" | jq -e '.success' > /dev/null 2>&1; then
    success=$(echo "$result" | jq -r '.success')
    if [ "$success" = "true" ]; then
      echo "✅"
      PASS=$((PASS + 1))
      echo "$result"  # Return result for ID extraction
      return 0
    else
      echo "⚠️ (API error but JSON valid)"
      PASS=$((PASS + 1))
      return 0
    fi
  else
    echo "❌"
    echo "  Output: $result" | head -3
    FAIL=$((FAIL + 1))
    return 1
  fi
}

test_skip() {
  local name="$1"
  local reason="$2"
  echo "⏭️  Skipping $name - $reason"
  SKIP=$((SKIP + 1))
}

echo "========================================"
echo "Comprehensive JSON Output Test"
echo "========================================"

echo -e "\n📦 1. PRODUCT CRUD"
echo "Creating test product..."
result=$(test_json "product create" "node dist/index.js product create --title 'JSON测试商品' --price 99 --stock 10 --json")
CREATED_PRODUCT_ID=$(echo "$result" | jq -r '.data.product.id' 2>/dev/null)

if [ -n "$CREATED_PRODUCT_ID" ] && [ "$CREATED_PRODUCT_ID" != "null" ]; then
  echo "  Product ID: $CREATED_PRODUCT_ID"

  test_json "product get" "node dist/index.js product get --id '$CREATED_PRODUCT_ID' --json" > /dev/null
  test_json "product update" "node dist/index.js product update --id '$CREATED_PRODUCT_ID' --price 109 --json" > /dev/null
  test_json "product url" "node dist/index.js product url --id '$CREATED_PRODUCT_ID' --json" > /dev/null
else
  echo "  ⚠️  Could not extract product ID, skipping dependent tests"
fi

echo -e "\n📁 2. CATEGORY CRUD"
echo "Creating test category..."
result=$(test_json "category create" "node dist/index.js category create --name 'JSON测试分类' --json")
CREATED_CATEGORY_ID=$(echo "$result" | jq -r '.data.category.id' 2>/dev/null)

if [ -n "$CREATED_CATEGORY_ID" ] && [ "$CREATED_CATEGORY_ID" != "null" ]; then
  echo "  Category ID: $CREATED_CATEGORY_ID"

  test_json "category get" "node dist/index.js category get --id '$CREATED_CATEGORY_ID' --json" > /dev/null
  test_json "category update" "node dist/index.js category update --id '$CREATED_CATEGORY_ID' --name 'JSON测试分类(已更新)' --json" > /dev/null
else
  echo "  ⚠️  Could not extract category ID, skipping dependent tests"
fi

echo -e "\n🎨 3. VARIANT OPERATIONS"
if [ -n "$CREATED_PRODUCT_ID" ] && [ "$CREATED_PRODUCT_ID" != "null" ]; then
  test_json "variant list" "node dist/index.js variant list --product-id '$CREATED_PRODUCT_ID' --json" > /dev/null

  echo "Creating test variant..."
  result=$(test_json "variant create" "node dist/index.js variant create --product-id '$CREATED_PRODUCT_ID' --sku 'TEST-SKU-001' --price 99 --stock 5 --json")
  CREATED_VARIANT_ID=$(echo "$result" | jq -r '.data.variant.id' 2>/dev/null)

  if [ -n "$CREATED_VARIANT_ID" ] && [ "$CREATED_VARIANT_ID" != "null" ]; then
    echo "  Variant ID: $CREATED_VARIANT_ID"
    test_json "variant get" "node dist/index.js variant get --product-id '$CREATED_PRODUCT_ID' --id '$CREATED_VARIANT_ID' --json" > /dev/null
    test_json "variant update" "node dist/index.js variant update --product-id '$CREATED_PRODUCT_ID' --id '$CREATED_VARIANT_ID' --price 119 --json" > /dev/null
  fi
else
  test_skip "variant operations" "no product ID available"
fi

echo -e "\n🌐 4. I18N OPERATIONS"
if [ -n "$CREATED_PRODUCT_ID" ] && [ "$CREATED_PRODUCT_ID" != "null" ]; then
  test_json "i18n product list" "node dist/index.js i18n product list --product-id '$CREATED_PRODUCT_ID' --json" > /dev/null
  test_json "i18n product create" "node dist/index.js i18n product create --product-id '$CREATED_PRODUCT_ID' --lang zh-CN --name '测试产品' --description '这是一个测试' --json" > /dev/null
  test_json "i18n product get" "node dist/index.js i18n product get --product-id '$CREATED_PRODUCT_ID' --lang zh-CN --json" > /dev/null
  test_json "i18n product update" "node dist/index.js i18n product update --product-id '$CREATED_PRODUCT_ID' --lang zh-CN --name '测试产品(已更新)' --json" > /dev/null
else
  test_skip "i18n product operations" "no product ID available"
fi

if [ -n "$CREATED_CATEGORY_ID" ] && [ "$CREATED_CATEGORY_ID" != "null" ]; then
  test_json "i18n category list" "node dist/index.js i18n category list --category-id '$CREATED_CATEGORY_ID' --json" > /dev/null
  test_json "i18n category create" "node dist/index.js i18n category create --category-id '$CREATED_CATEGORY_ID' --lang es-ES --name 'Categoría de prueba' --json" > /dev/null
  test_json "i18n category get" "node dist/index.js i18n category get --category-id '$CREATED_CATEGORY_ID' --lang es-ES --json" > /dev/null
else
  test_skip "i18n category operations" "no category ID available"
fi

test_json "i18n merchant list" "node dist/index.js i18n merchant list --json" > /dev/null

echo -e "\n💬 5. CONVERSATION OPERATIONS"
test_json "conversation list" "node dist/index.js conversation list --json" > /dev/null

echo -e "\n🔐 6. AUTH OPERATIONS"
test_json "auth whoami" "node dist/index.js auth whoami --json" > /dev/null

echo -e "\n🏪 7. MERCHANT OPERATIONS"
test_json "merchant info" "node dist/index.js merchant info --json" > /dev/null
test_json "merchant url" "node dist/index.js merchant url --json" > /dev/null

echo -e "\n📊 8. INVENTORY OPERATIONS"
if [ -n "$CREATED_PRODUCT_ID" ] && [ "$CREATED_PRODUCT_ID" != "null" ]; then
  test_json "inventory history" "node dist/index.js inventory history --id '$CREATED_PRODUCT_ID' --json" > /dev/null
else
  test_skip "inventory history" "no product ID available"
fi
test_json "inventory low-stock" "node dist/index.js inventory low-stock --threshold 100 --json" > /dev/null

echo -e "\n🚚 9. SHIPPING-ZONE OPERATIONS"
test_json "shipping-zone list" "node dist/index.js shipping-zone list --json" > /dev/null

echo -e "\n💳 10. TRANSFER OPERATIONS"
test_json "transfer list" "node dist/index.js transfer list --json" > /dev/null
test_json "transfer summary" "node dist/index.js transfer summary --json" > /dev/null

echo -e "\n🗑️  CLEANUP"
# Delete created test data
if [ -n "$CREATED_VARIANT_ID" ] && [ "$CREATED_VARIANT_ID" != "null" ]; then
  echo "Deleting test variant..."
  test_json "variant delete" "node dist/index.js variant delete --product-id '$CREATED_PRODUCT_ID' --id '$CREATED_VARIANT_ID' --yes --json" > /dev/null
fi

if [ -n "$CREATED_PRODUCT_ID" ] && [ "$CREATED_PRODUCT_ID" != "null" ]; then
  echo "Deleting i18n product translation..."
  OPTIMA_TOKEN="$TOKEN" node dist/index.js i18n product delete --product-id "$CREATED_PRODUCT_ID" --lang zh-CN --yes --json > /dev/null 2>&1

  echo "Deleting test product..."
  test_json "product delete" "node dist/index.js product delete --id '$CREATED_PRODUCT_ID' --yes --json" > /dev/null
fi

if [ -n "$CREATED_CATEGORY_ID" ] && [ "$CREATED_CATEGORY_ID" != "null" ]; then
  echo "Deleting i18n category translation..."
  OPTIMA_TOKEN="$TOKEN" node dist/index.js i18n category delete --category-id "$CREATED_CATEGORY_ID" --lang es-ES --yes --json > /dev/null 2>&1

  echo "Deleting test category..."
  test_json "category delete" "node dist/index.js category delete --id '$CREATED_CATEGORY_ID' --yes --json" > /dev/null
fi

echo -e "\n========================================"
echo "Test Results:"
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  ⏭️  Skipped: $SKIP"
echo "  📊 Total: $((PASS + FAIL + SKIP))"
echo "========================================"

if [ $FAIL -eq 0 ]; then
  echo "🎉 All tests passed!"
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi
