import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

export const addVariantImagesCommand = new Command('add-images')
  .description('添加变体图片（支持本地文件或 Media ID）')
  .option('--product-id <id>', '商品 ID')
  .option('--variant-id <id>', '变体 ID')
  .option('--path <paths...>', '本地图片文件路径（支持多个）')
  .option('--media-id <ids...>', 'Media ID（从 upload 命令获取，支持多个）')
  .action(async (options: { productId?: string; variantId?: string; path?: string[]; mediaId?: string[] }) => {
    try {
      await addVariantImages(options);
    } catch (error) {
      handleError(error);
    }
  });

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
    const spinner = ora(`正在关联 ${mediaIds.length} 张图片...`).start();

    try {
      const result = await commerceApi.variants.addImagesByMediaIds(productId, variantId, mediaIds);
      spinner.succeed(`图片关联成功！(${mediaIds.length} 张)`);

      console.log();
      if (result.images && result.images.length > 0) {
        console.log(chalk.gray('已关联图片数量: ') + chalk.green(result.images.length.toString()));
        console.log(chalk.gray('图片 URL:'));
        result.images.forEach((url: string, index: number) => {
          console.log(chalk.cyan(`  ${index + 1}. ${url}`));
        });
      }
      console.log();
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

  const spinner = ora('正在上传图片...').start();

  try {
    const result = await commerceApi.variants.addImages(productId, variantId, imagePaths);
    spinner.succeed('图片上传成功！');

    console.log();
    if (result.images && result.images.length > 0) {
      console.log(chalk.gray('已上传图片数量: ') + chalk.green(result.images.length.toString()));
      console.log(chalk.gray('图片 URL:'));
      result.images.forEach((url: string, index: number) => {
        console.log(chalk.cyan(`  ${index + 1}. ${url}`));
      });
    }
    console.log();
  } catch (error: any) {
    spinner.fail('图片上传失败');
    throw createApiError(error);
  }
}
