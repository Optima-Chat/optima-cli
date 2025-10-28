import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('add-images')
  .description('Add images to variant (supports local files or media IDs)')
  .option('--product-id <uuid>', 'Product ID (required)')
  .option('--variant-id <uuid>', 'Variant ID (required)')
  .option('--path <paths...>', 'Local image file paths (multiple allowed)')
  .option('--media-id <ids...>', 'Media IDs from upload command (multiple allowed)')
  .action(async (options: { productId?: string; variantId?: string; path?: string[]; mediaId?: string[] }) => {
    try {
      await addVariantImages(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Upload and add images from local files',
    '$ optima variant add-images \\',
    '  --product-id abc-123 \\',
    '  --variant-id var-456 \\',
    '  --path ./white-front.jpg ./white-back.jpg',
    '',
    '# Add images using media IDs (recommended)',
    '$ optima upload image --path ./photo.jpg',
    '# Copy media_id from response',
    '$ optima variant add-images \\',
    '  --product-id abc-123 \\',
    '  --variant-id var-456 \\',
    '  --media-id media_789 media_012',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        product_id: 'uuid',
        variant_id: 'uuid',
        images: [
          'https://cdn.optima.shop/uploads/...',
          'https://cdn.optima.shop/uploads/...'
        ],
        count: 2
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'upload image', description: 'Upload images first to get media IDs' },
    { command: 'variant create', description: 'Create variant before adding images' },
    { command: 'variant list', description: 'Find variant IDs' },
  ],
  notes: [
    'product-id and variant-id are required',
    'Provide either --path or --media-id (not both)',
    'Using --media-id is recommended (upload first, then associate)',
    'Multiple images can be added in one command',
  ]
});

export const addVariantImagesCommand = cmd;

async function addVariantImages(options: { productId?: string; variantId?: string; path?: string[]; mediaId?: string[] }) {
  // 验证参数
  if (!options.productId || options.productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }
  if (!options.variantId || options.variantId.trim().length === 0) {
    throw new ValidationError('变体 ID 不能为空', 'variant-id');
  }

  const productId = options.productId;
  const variantId = options.variantId;

  const { path: imagePaths = [], mediaId: mediaIds = [] } = options;

  if (imagePaths.length === 0 && mediaIds.length === 0) {
    throw new ValidationError('请至少提供一张图片（--path 或 --media-id）', 'images');
  }

  // 如果有 Media IDs，直接关联
  if (mediaIds.length > 0) {
    const spinner = output.spinner(`正在关联 ${mediaIds.length} 张图片...`);

    try {
      const result = await commerceApi.variants.addImagesByMediaIds(productId, variantId, mediaIds);
      spinner.succeed(`图片关联成功！(${mediaIds.length} 张)`);

      if (output.isJson()) {
        output.success({
          product_id: productId,
          variant_id: variantId,
          images: result.images || [],
          count: (result.images || []).length
        });
      } else {
        console.log();
        if (result.images && result.images.length > 0) {
          console.log(chalk.gray('已关联图片数量: ') + chalk.green(result.images.length.toString()));
          console.log(chalk.gray('图片 URL:'));
          result.images.forEach((url: string, index: number) => {
            console.log(chalk.cyan(`  ${index + 1}. ${url}`));
          });
        }
        console.log();
      }
    } catch (error: any) {
      spinner.fail('图片关联失败');
      throw createApiError(error);
    }
    return;
  }

  // 验证本地图片文件存在
  for (const imagePath of imagePaths) {
    if (!existsSync(imagePath)) {
      throw new ValidationError(`图片文件不存在: ${imagePath}`, 'image-paths');
    }
  }

  const spinner = output.spinner('正在上传图片...');

  try {
    const result = await commerceApi.variants.addImages(productId, variantId, imagePaths);
    spinner.succeed('图片上传成功！');

    if (output.isJson()) {
      output.success({
        product_id: productId,
        variant_id: variantId,
        images: result.images || [],
        count: (result.images || []).length
      });
    } else {
      console.log();
      if (result.images && result.images.length > 0) {
        console.log(chalk.gray('已上传图片数量: ') + chalk.green(result.images.length.toString()));
        console.log(chalk.gray('图片 URL:'));
        result.images.forEach((url: string, index: number) => {
          console.log(chalk.cyan(`  ${index + 1}. ${url}`));
        });
      }
      console.log();
    }
  } catch (error: any) {
    spinner.fail('图片上传失败');
    throw createApiError(error);
  }
}
