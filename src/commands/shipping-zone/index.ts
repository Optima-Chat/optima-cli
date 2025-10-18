import { Command } from 'commander';
import { listZonesCommand } from './list.js';
import { createZoneCommand } from './create.js';
import { deleteZoneCommand } from './delete.js';
import { listRatesCommand, createRateCommand } from './rates.js';

export const shippingZoneCommand = new Command('shipping-zone')
  .alias('zone')
  .description('运费区域管理')
  .addCommand(listZonesCommand)
  .addCommand(createZoneCommand)
  .addCommand(deleteZoneCommand)
  .addCommand(listRatesCommand)
  .addCommand(createRateCommand);
