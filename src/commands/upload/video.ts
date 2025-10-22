import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

export const uploadVideoCommand = new Command('video')
  .description('上传视频')
  .option('--path <path>', '视频文件路径')
  .action(async (options: { path?: string }) => {
    try {
      await uploadVideo(options);
    } catch (error) {
      handleError(error);
    }
  });

async function uploadVideo(options: { path?: string }) {
  if (!options.path || options.path.trim().length === 0) {
    throw new ValidationError('视频路径不能为空', 'path');
  }

  const videoPath = options.path;

  if (!existsSync(videoPath)) {
    throw new ValidationError(`视频文件不存在: ${videoPath}`, 'video-path');
  }

  const spinner = ora('正在上传视频...').start();

  try {
    const result = await commerceApi.upload.uploadVideo(videoPath);
    spinner.succeed('视频上传成功！');

    console.log();
    console.log(chalk.gray('视频 URL: ') + chalk.cyan(result.url));
    console.log();
  } catch (error: any) {
    spinner.fail('视频上传失败');
    throw createApiError(error);
  }
}
