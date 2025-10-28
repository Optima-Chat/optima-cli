import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('image')
  .description('Upload an image file and get media ID for products')
  .option('--path <filepath>', 'Local image file path (required)')
  .action(async (options: { path?: string }) => {
    try {
      await uploadImage(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Upload product image',
    '$ optima upload image --path ./product.jpg',
    '',
    '# Upload and use media ID for product',
    '$ optima upload image --path ./mug.png',
    '# Copy media_id from response',
    '$ optima product create \\',
    '  --title "Ceramic Mug" \\',
    '  --price 29.99 \\',
    '  --media-ids "<media_id>"',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        media_id: 'uuid',
        filename: 'product.jpg',
        url: 'https://cdn.optima.shop/uploads/...',
        size: 125432,
        mime_type: 'image/jpeg',
        uploaded_at: 'timestamp'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'product create', description: 'Create product with uploaded images' },
    { command: 'product add-images', description: 'Add images to existing product' },
  ],
  notes: [
    'Returns media_id needed for product/variant image association',
    'Supported formats: JPG, PNG, GIF, WebP',
    'Maximum file size: 10MB',
    'Upload first, then use media_id when creating/updating products',
  ]
});

export const uploadImageCommand = cmd;

async function uploadImage(options: { path?: string }) {
  if (!options.path || options.path.trim().length === 0) {
    throw new ValidationError('图片路径不能为空', 'path');
  }

  const imagePath = options.path;

  if (!existsSync(imagePath)) {
    throw new ValidationError(`图片文件不存在: ${imagePath}`, 'image-path');
  }

  const spinner = output.spinner('正在上传图片...');

  try {
    const result = await commerceApi.upload.uploadImage(imagePath);
    spinner.succeed('图片上传成功！');

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      output.success({
        url: result.url,
        media_id: result.media_id,
        file_path: imagePath
      });
    } else {
      // Pretty 模式：保持原有格式化输出
      console.log();
      console.log(chalk.gray('图片 URL:   ') + chalk.cyan(result.url));
      if (result.media_id) {
        console.log(chalk.gray('Media ID:   ') + chalk.green(result.media_id));
      }
      console.log();
    }
  } catch (error: any) {
    spinner.fail('图片上传失败');
    throw createApiError(error);
  }
}
