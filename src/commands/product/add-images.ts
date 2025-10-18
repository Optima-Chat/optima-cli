import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatFileSize } from '../../utils/format.js';
import { existsSync, statSync } from 'fs';

export const addImagesCommand = new Command('add-images')
  .description('添加商品图片（支持本地文件路径或图片 URL）')
  .argument('<product-id>', '商品 ID')
  .option('--path <paths...>', '本地图片文件路径（支持多个）')
  .option('--url <urls...>', '图片 URL（支持多个）')
  .action(async (productId: string, options: { path?: string[]; url?: string[] }) => {
    try {
      const imagePaths = [...(options.path || []), ...(options.url || [])];
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
    throw new ValidationError('请至少提供一张图片路径或 URL', 'image-paths');
  }

  // 分类：本地文件 vs URL
  const localFiles: string[] = [];
  const imageUrls: string[] = [];

  console.log(chalk.cyan('\n📷 验证输入...\n'));

  for (const path of imagePaths) {
    // 判断是否为 URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
      console.log(chalk.green(`✓ URL: ${path}`));
      imageUrls.push(path);
      continue;
    }

    // 验证本地文件
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

  if (localFiles.length === 0 && imageUrls.length === 0) {
    throw new ValidationError('没有有效的图片文件或 URL', 'image-paths');
  }

  console.log();

  // 如果有 URL，直接用 image_urls API
  if (imageUrls.length > 0 && localFiles.length === 0) {
    const spinner = ora(`正在关联 ${imageUrls.length} 张图片...`).start();

    try {
      const result = await commerceApi.products.addImageUrls(productId, imageUrls);
      spinner.succeed(`图片关联成功！(${imageUrls.length} 张)`);

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
    } catch (error: any) {
      spinner.fail('图片关联失败');
      throw createApiError(error);
    }
    return;
  }

  // 如果有本地文件，上传
  if (localFiles.length > 0) {
    const spinner = ora(`正在上传 ${localFiles.length} 张图片...`).start();

    try {
      const result = await commerceApi.products.addImages(productId, localFiles);
      spinner.succeed(`图片上传成功！(${localFiles.length} 张)`);

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
    } catch (error: any) {
      spinner.fail('图片上传失败');
      throw createApiError(error);
    }
  }

  // TODO: 如果同时有 URL 和本地文件，需要分两步处理
}
