import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('video')
  .description('Upload video file for product demos or marketing')
  .option('--path <path>', 'Local video file path (required)')
  .action(async (options: { path?: string }) => {
    try {
      await uploadVideo(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Upload product demo video',
    '$ optima upload video --path ./demo.mp4',
    '',
    '# Then use URL in product description or marketing',
  ],
  output: {
    description: 'Returns publicly accessible video URL',
    example: JSON.stringify({
      success: true,
      data: {
        url: 'https://v1.optima.shop/video/demo-123.mp4',
        video_path: './demo.mp4'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'upload image', description: 'Upload product images' },
    { command: 'upload file', description: 'Upload documents/files' },
    { command: 'product create', description: 'Create product with media' },
  ],
  notes: [
    'File path is required',
    'Supported formats: MP4, MOV, AVI, WebM',
    'Maximum file size: 100MB',
    'Returns permanent CDN URL',
  ]
});

export const uploadVideoCommand = cmd;

async function uploadVideo(options: { path?: string }) {
  if (!options.path || options.path.trim().length === 0) {
    throw new ValidationError('视频路径不能为空', 'path');
  }

  const videoPath = options.path;

  if (!existsSync(videoPath)) {
    throw new ValidationError(`视频文件不存在: ${videoPath}`, 'video-path');
  }

  const spinner = output.spinner('正在上传视频...');

  try {
    const result = await commerceApi.upload.uploadVideo(videoPath);
    spinner.succeed('视频上传成功！');

    if (output.isJson()) {
      output.success({
        url: result.url,
        video_path: videoPath
      });
    } else {
      console.log();
      console.log(chalk.gray('视频 URL: ') + chalk.cyan(result.url));
      console.log();
    }
  } catch (error: any) {
    spinner.fail('视频上传失败');
    throw createApiError(error);
  }
}
