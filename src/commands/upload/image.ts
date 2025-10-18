import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

export const uploadImageCommand = new Command('image')
  .description('上传图片')
  .argument('<image-path>', '图片文件路径')
  .action(async (imagePath: string) => {
    try {
      await uploadImage(imagePath);
    } catch (error) {
      handleError(error);
    }
  });

async function uploadImage(imagePath: string) {
  if (!imagePath || imagePath.trim().length === 0) {
    throw new ValidationError('图片路径不能为空', 'image-path');
  }

  if (!existsSync(imagePath)) {
    throw new ValidationError(`图片文件不存在: ${imagePath}`, 'image-path');
  }

  const spinner = ora('正在上传图片...').start();

  try {
    const result = await commerceApi.upload.uploadImage(imagePath);
    spinner.succeed('图片上传成功！');

    console.log();
    console.log(chalk.gray('图片 URL:   ') + chalk.cyan(result.url));
    if (result.media_id) {
      console.log(chalk.gray('Media ID:   ') + chalk.green(result.media_id));
    }
    console.log();
  } catch (error: any) {
    spinner.fail('图片上传失败');
    throw createApiError(error);
  }
}
