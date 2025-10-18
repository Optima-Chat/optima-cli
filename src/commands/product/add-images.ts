import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatFileSize } from '../../utils/format.js';
import { existsSync, statSync } from 'fs';

export const addImagesCommand = new Command('add-images')
  .description('添加商品图片')
  .argument('<product-id>', '商品 ID')
  .argument('<image-paths...>', '图片路径（支持多个）')
  .action(async (productId: string, imagePaths: string[]) => {
    try {
      await addImages(productId, imagePaths);
    } catch (error) {
      handleError(error);
    }
  });

async function addImages(productId: string, imagePaths: string[]) {
  // 验证参数
  if (!productId || productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }

  if (!imagePaths || imagePaths.length === 0) {
    throw new ValidationError('请至少提供一张图片路径', 'image-paths');
  }

  // 验证图片文件
  const validPaths: string[] = [];
  const invalidPaths: string[] = [];

  console.log(chalk.cyan('\n📷 验证图片文件...\n'));

  for (const path of imagePaths) {
    if (!existsSync(path)) {
      invalidPaths.push(path);
      console.log(chalk.red(`✗ 文件不存在: ${path}`));
      continue;
    }

    const stats = statSync(path);
    const fileSize = stats.size;

    // 检查文件大小（限制 10MB）
    if (fileSize > 10 * 1024 * 1024) {
      invalidPaths.push(path);
      console.log(chalk.red(`✗ 文件过大 (${formatFileSize(fileSize)}): ${path}`));
      continue;
    }

    // 检查文件扩展名
    const ext = path.toLowerCase().split('.').pop();
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      invalidPaths.push(path);
      console.log(chalk.red(`✗ 不支持的图片格式: ${path}`));
      continue;
    }

    validPaths.push(path);
    console.log(chalk.green(`✓ ${path} (${formatFileSize(fileSize)})`));
  }

  if (validPaths.length === 0) {
    throw new ValidationError('没有有效的图片文件');
  }

  if (invalidPaths.length > 0) {
    console.log(chalk.yellow(`\n⚠️  跳过 ${invalidPaths.length} 个无效文件\n`));
  }

  // 上传图片
  const spinner = ora(`正在上传 ${validPaths.length} 张图片...`).start();

  try {
    const result = await commerceApi.products.addImages(productId, validPaths);
    spinner.succeed(`图片上传成功！(${validPaths.length} 张)`);

    console.log();
    if (result.images && result.images.length > 0) {
      console.log(chalk.gray('已上传的图片 URL:'));
      result.images.forEach((url, index) => {
        console.log(chalk.gray(`  ${index + 1}. `) + chalk.cyan(url));
      });
    }
    console.log();
  } catch (error: any) {
    spinner.fail('图片上传失败');
    throw createApiError(error);
  }
}
