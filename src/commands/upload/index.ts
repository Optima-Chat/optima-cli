import { Command } from 'commander';
import { uploadImageCommand } from './image.js';
import { uploadVideoCommand } from './video.js';
import { uploadFileCommand } from './file.js';

export const uploadCommand = new Command('upload')
  .description('文件上传')
  .addCommand(uploadImageCommand)
  .addCommand(uploadVideoCommand)
  .addCommand(uploadFileCommand);
