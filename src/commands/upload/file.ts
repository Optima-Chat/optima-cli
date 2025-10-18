import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

export const uploadFileCommand = new Command('file')
  .description('上传文件')
  .argument('<file-path>', '文件路径')
  .action(async (filePath: string) => {
    try {
      await uploadFile(filePath);
    } catch (error) {
      handleError(error);
    }
  });

async function uploadFile(filePath: string) {
  if (!filePath || filePath.trim().length === 0) {
    throw new ValidationError('文件路径不能为空', 'file-path');
  }

  if (!existsSync(filePath)) {
    throw new ValidationError(`文件不存在: ${filePath}`, 'file-path');
  }

  const spinner = ora('正在上传文件...').start();

  try {
    const result = await commerceApi.upload.uploadFile(filePath);
    spinner.succeed('文件上传成功！');

    console.log();
    console.log(chalk.gray('文件 URL: ') + chalk.cyan(result.url));
    console.log();
  } catch (error: any) {
    spinner.fail('文件上传失败');
    throw createApiError(error);
  }
}
