import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatFileSize } from '../../utils/format.js';
import { existsSync, statSync } from 'fs';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('add-images')
  .description('Add images to product (local files, URLs, or media IDs)')
  .option('--id <uuid>', 'Product ID (required)')
  .option('--path <paths...>', 'Local image file paths (multiple allowed)')
  .option('--url <urls...>', 'Image URLs (multiple allowed)')
  .option('--media-id <ids...>', 'Media IDs from upload command (multiple allowed, recommended)')
  .action(async (options: { id?: string; path?: string[]; url?: string[]; mediaId?: string[] }) => {
    try {
      await addImages(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Method 1: Upload and add local files directly',
    '$ optima product add-images \\',
    '  --id prod-123 \\',
    '  --path ./photo1.jpg ./photo2.jpg',
    '',
    '# Method 2: Use media IDs (RECOMMENDED)',
    '$ optima upload image --path ./photo.jpg',
    '# Copy media_id from response',
    '$ optima product add-images \\',
    '  --id prod-123 \\',
    '  --media-id media_456 media_789',
    '',
    '# Method 3: Use image URLs',
    '$ optima product add-images \\',
    '  --id prod-123 \\',
    '  --url https://example.com/image.jpg',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        product_id: 'uuid',
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
    { command: 'product create', description: 'Create product with images' },
    { command: 'product get', description: 'View current product images' },
  ],
  notes: [
    'Product ID is required',
    'Provide one of: --path, --url, or --media-id',
    'Using --media-id is recommended (upload first, then associate)',
    'Multiple images can be added in one command',
    'Supported formats: JPG, PNG, GIF, WebP',
    'Maximum file size: 10MB per image',
  ]
});

export const addImagesCommand = cmd;

async function addImages(options: { id?: string; path?: string[]; url?: string[]; mediaId?: string[] }) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'id');
  }

  const productId = options.id;

  const { path: localPaths = [], url: imageUrls = [], mediaId: mediaIds = [] } = options;

  if (localPaths.length === 0 && imageUrls.length === 0 && mediaIds.length === 0) {
    throw new ValidationError('请至少提供一张图片（--path、--url 或 --media-id）', 'images');
  }

  console.log(chalk.cyan('\n📷 验证输入...\n'));

  // 1. 如果有 Media IDs，直接关联
  if (mediaIds.length > 0) {
    console.log(chalk.green(`✓ Media IDs: ${mediaIds.length} 个`));
    console.log();

    const spinner = output.spinner(`正在关联 ${mediaIds.length} 张图片...`);

    try {
      const result = await commerceApi.products.addImagesByMediaIds(productId, mediaIds);
      spinner.succeed(`图片关联成功！(${mediaIds.length} 张)`);

      if (output.isJson()) {
        output.success({
          product_id: productId,
          images: result.images || [],
          count: (result.images || []).length
        });
      } else {
        console.log();
        if (result.images && result.images.length > 0) {
          console.log(chalk.gray('已关联的图片 URL:'));
          result.images.forEach((item: any, index: number) => {
            const url = typeof item === 'string' ? item : (item.url || item.image_url || item);
            console.log(chalk.gray(`  ${index + 1}. `) + chalk.cyan(url));
          });
        }
        console.log();
      }
      return;
    } catch (error: any) {
      spinner.fail('图片关联失败');
      throw createApiError(error);
    }
  }

  // 2. 验证本地文件
  const localFiles: string[] = [];
  for (const path of localPaths) {
    if (!existsSync(path)) {
      console.log(chalk.red(`✗ 文件不存在: ${path}`));
      continue;
    }

    const stats = statSync(path);
    const fileSize = stats.size;

    // 检查文件大小（限制 10MB）
    if (fileSize > 10 * 1024 * 1024) {
      console.log(chalk.red(`✗ 文件过大 (${formatFileSize(fileSize)}): ${path}`));
      continue;
    }

    // 检查文件扩展名
    const ext = path.toLowerCase().split('.').pop();
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      console.log(chalk.red(`✗ 不支持的图片格式: ${path}`));
      continue;
    }

    console.log(chalk.green(`✓ ${path} (${formatFileSize(fileSize)})`));
    localFiles.push(path);
  }

  // 3. 显示 URLs
  for (const url of imageUrls) {
    console.log(chalk.green(`✓ URL: ${url}`));
  }

  if (localFiles.length === 0 && imageUrls.length === 0) {
    throw new ValidationError('没有有效的图片文件或 URL', 'images');
  }

  console.log();

  // 如果有 URL，直接用 image_urls API
  if (imageUrls.length > 0 && localFiles.length === 0) {
    const spinner = output.spinner(`正在关联 ${imageUrls.length} 张图片...`);

    try {
      const result = await commerceApi.products.addImageUrls(productId, imageUrls);
      spinner.succeed(`图片关联成功！(${imageUrls.length} 张)`);

      if (output.isJson()) {
        output.success({
          product_id: productId,
          images: result.images || [],
          count: (result.images || []).length
        });
      } else {
        console.log();
        if (result.images && result.images.length > 0) {
          console.log(chalk.gray('已关联的图片 URL:'));
          result.images.forEach((item: any, index: number) => {
            // 支持字符串或对象格式
            const url = typeof item === 'string' ? item : (item.url || item.image_url || item);
            console.log(chalk.gray(`  ${index + 1}. `) + chalk.cyan(url));
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

  // 如果有本地文件，上传
  if (localFiles.length > 0) {
    const spinner = output.spinner(`正在上传 ${localFiles.length} 张图片...`);

    try {
      const result = await commerceApi.products.addImages(productId, localFiles);
      spinner.succeed(`图片上传成功！(${localFiles.length} 张)`);

      if (output.isJson()) {
        output.success({
          product_id: productId,
          images: result.images || [],
          count: (result.images || []).length
        });
      } else {
        console.log();
        if (result.images && result.images.length > 0) {
          console.log(chalk.gray('已上传的图片 URL:'));
          result.images.forEach((item: any, index: number) => {
            // 支持字符串或对象格式
            const url = typeof item === 'string' ? item : (item.url || item.image_url || item);
            console.log(chalk.gray(`  ${index + 1}. `) + chalk.cyan(url));
          });
        }
        console.log();
      }
    } catch (error: any) {
      spinner.fail('图片上传失败');
      throw createApiError(error);
    }
  }

  // TODO: 如果同时有 URL 和本地文件，需要分两步处理
}
