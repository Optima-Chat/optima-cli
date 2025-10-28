import { Command } from 'commander';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatVariant } from '../../utils/format.js';
import { output } from '../../utils/output.js';

interface UpdateVariantOptions {
  productId?: string;
  variantId?: string;
  sku?: string;
  price?: string;
  stock?: string;
  attributes?: string;
}

export const updateVariantCommand = new Command('update')
  .description('更新变体')
  .option('--product-id <id>', '商品 ID')
  .option('--variant-id <id>', '变体 ID')
  .option('-s, --sku <sku>', 'SKU 编码')
  .option('-p, --price <price>', '价格')
  .option('--stock <quantity>', '库存数量')
  .option('-a, --attributes <json>', '属性（JSON 格式）')
  .action(async (options: UpdateVariantOptions) => {
    try {
      await updateVariant(options);
    } catch (error) {
      handleError(error);
    }
  });

async function updateVariant(options: UpdateVariantOptions) {
  // 验证参数
  if (!options.productId || options.productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }
  if (!options.variantId || options.variantId.trim().length === 0) {
    throw new ValidationError('变体 ID 不能为空', 'variant-id');
  }

  const productId = options.productId;
  const variantId = options.variantId;

  // 构建更新数据
  const updateData: any = {};

  if (options.sku !== undefined) {
    updateData.sku = options.sku;
  }

  if (options.price !== undefined) {
    const priceNum = parseFloat(options.price);
    if (isNaN(priceNum)) {
      throw new ValidationError('价格必须是有效数字', 'price');
    }
    updateData.price = priceNum;
  }

  if (options.stock !== undefined) {
    const stockNum = parseInt(options.stock, 10);
    if (isNaN(stockNum)) {
      throw new ValidationError('库存必须是有效整数', 'stock');
    }
    updateData.stock = stockNum;
  }

  if (options.attributes !== undefined) {
    try {
      updateData.attributes = JSON.parse(options.attributes);
    } catch {
      throw new ValidationError('属性必须是有效的 JSON 格式', 'attributes');
    }
  }

  // 检查是否有更新内容
  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('请至少提供一个要更新的字段', 'options');
  }

  const spinner = output.spinner('正在更新变体...');

  try {
    const variant = await commerceApi.variants.update(productId, variantId, updateData);
    spinner.succeed('变体更新成功！');

    if (output.isJson()) {
      output.success({
        product_id: productId,
        variant_id: variantId,
        updated_fields: Object.keys(updateData),
        variant
      });
    } else {
      // 显示变体详情
      console.log();
      console.log(formatVariant(variant));
    }
  } catch (error: any) {
    spinner.fail('变体更新失败');
    throw createApiError(error);
  }
}
