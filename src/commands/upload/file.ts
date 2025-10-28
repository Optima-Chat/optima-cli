import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('file')
  .description('Upload document or file (PDFs, catalogs, manuals, etc.)')
  .option('--path <path>', 'Local file path (required)')
  .action(async (options: { path?: string }) => {
    try {
      await uploadFile(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Upload product manual',
    '$ optima upload file --path ./manual.pdf',
    '',
    '# Upload catalog or spec sheet',
    '$ optima upload file --path ./catalog.xlsx',
  ],
  output: {
    description: 'Returns publicly accessible file URL',
    example: JSON.stringify({
      success: true,
      data: {
        url: 'https://v1.optima.shop/file/manual-123.pdf',
        file_path: './manual.pdf'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'upload image', description: 'Upload product images' },
    { command: 'upload video', description: 'Upload video content' },
    { command: 'product create', description: 'Create product with attachments' },
  ],
  notes: [
    'File path is required',
    'Supported formats: PDF, DOCX, XLSX, TXT, ZIP',
    'Maximum file size: 50MB',
    'Returns permanent CDN URL for downloads',
  ]
});

export const uploadFileCommand = cmd;

async function uploadFile(options: { path?: string }) {
  if (!options.path || options.path.trim().length === 0) {
    throw new ValidationError('文件路径不能为空', 'path');
  }

  const filePath = options.path;

  if (!existsSync(filePath)) {
    throw new ValidationError(`文件不存在: ${filePath}`, 'file-path');
  }

  const spinner = output.spinner('正在上传文件...');

  try {
    const result = await commerceApi.upload.uploadFile(filePath);
    spinner.succeed('文件上传成功！');

    if (output.isJson()) {
      output.success({
        url: result.url,
        file_path: filePath
      });
    } else {
      console.log();
      console.log(chalk.gray('文件 URL: ') + chalk.cyan(result.url));
      console.log();
    }
  } catch (error: any) {
    spinner.fail('文件上传失败');
    throw createApiError(error);
  }
}
