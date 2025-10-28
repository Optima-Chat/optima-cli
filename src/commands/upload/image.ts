import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';

export const uploadImageCommand = new Command('image')
  .description('上传图片')
  .option('--path <path>', '图片文件路径')
  .action(async (options: { path?: string }) => {
    try {
      await uploadImage(options);
    } catch (error) {
      handleError(error);
    }
  });

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
