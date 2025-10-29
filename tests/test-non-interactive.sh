#!/bin/bash
# Integration test for non-interactive mode
# Tests all 20 commands that use inquirer.prompt()

set -e

echo "🧪 Testing Non-Interactive Mode for Optima CLI"
echo "=============================================="
echo ""

PASSED=0
FAILED=0

# Test function
test_command() {
    local cmd="$1"
    local expected_error="$2"
    local description="$3"

    echo -n "Testing: $description... "

    # Run command in non-interactive mode and capture output
    output=$(NON_INTERACTIVE=1 $cmd 2>&1 || true)

    # Check if output contains expected error pattern
    if echo "$output" | grep -q "$expected_error"; then
        echo "✅ PASS"
        ((PASSED++))
    else
        echo "❌ FAIL"
        echo "   Expected: $expected_error"
        echo "   Got: $output"
        ((FAILED++))
    fi
}

echo "📦 Tier 1: Core Commands (4)"
echo "----------------------------"
test_command "optima shipping calculate" "缺少必需参数: --country" "shipping calculate"
test_command "optima product create" "缺少必需参数: --title" "product create"
test_command "optima order ship --id test-123" "缺少必需参数: --tracking" "order ship"
test_command "optima category create" "缺少必需参数: --name" "category create"
echo ""

echo "📦 Tier 2: Common Commands (5)"
echo "-------------------------------"
test_command "optima variant create --product-id prod-123" "缺少必需参数: --sku" "variant create"
test_command "optima inventory update --id prod-123" "缺少必需参数: --quantity" "inventory update"
test_command "optima inventory reserve --id prod-123" "缺少必需参数: --quantity" "inventory reserve"
test_command "optima shipping-zone create" "缺少必需参数: --name" "shipping-zone create"
test_command "optima shipping-zone add-rate --zone-id zone-123" "缺少必需参数: --name" "shipping-zone add-rate"
echo ""

echo "📦 Tier 3: Confirmation Commands (8)"
echo "-------------------------------------"
test_command "optima product delete --id prod-123" "非交互环境需要使用 --yes 标志" "product delete"
test_command "optima category delete --id cat-123" "非交互环境需要使用 --yes 标志" "category delete"
test_command "optima variant delete --product-id prod-123 --variant-id var-123" "非交互环境需要使用 --yes 标志" "variant delete"
test_command "optima order cancel --id order-123" "非交互环境需要使用 --yes 标志" "order cancel"
test_command "optima order complete --id order-123" "非交互环境需要使用 --yes 标志" "order complete"
test_command "optima shipping-zone delete --id zone-123" "非交互环境需要使用 --yes 标志" "shipping-zone delete"
test_command "optima cleanup" "非交互环境需要使用 --yes 标志" "cleanup"
test_command "optima shipping update-status --id order-123" "缺少必需参数: --status" "shipping update-status"
echo ""

echo "📦 Tier 4: i18n Commands (3)"
echo "-----------------------------"
test_command "optima i18n product create --product-id prod-123" "缺少必需参数: --lang" "i18n product create"
test_command "optima i18n category create --category-id cat-123" "缺少必需参数: --lang" "i18n category create"
test_command "optima i18n merchant create" "缺少必需参数: --lang" "i18n merchant create"
echo ""

echo "=============================================="
echo "📊 Test Results"
echo "=============================================="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi
