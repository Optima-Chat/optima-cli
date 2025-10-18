import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

export const addVariantImagesCommand = new Command('add-images')
  .description('添加变体图片')
  .argument('<product-id>', '商品 ID')
  .argument('<variant-id>', '变体 ID')
  .option('--path <paths...>', '本地图片文件路径（支持多个）')
  .option('--url <urls...>', '图片 URL（支持多个）')
  .action(async (productId: string, variantId: string, options: { path?: string[]; url?: string[] }) => {
    try {
      const imagePaths = [...(options.path || []), ...(options.url || [])];
      await addVariantImages(productId, variantId, imagePaths);
    } catch (error) {
      handleError(error);
    }
  });

async function addVariantImages(productId: string, variantId: string, imagePaths: string[]) {
  // 验证参数
  if (!productId || productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }
  if (!variantId || variantId.trim().length === 0) {
    throw new ValidationError('变体 ID 不能为空', 'variant-id');
  }
  if (!imagePaths || imagePaths.length === 0) {
    throw new ValidationError('请至少提供一个图片路径', 'image-paths');
  }

  // 验证图片文件存在
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
