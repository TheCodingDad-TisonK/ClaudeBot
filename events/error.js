import logger from '../utils/logger.js';

export const name = 'error';
export const once = false;

export function execute(error) {
  logger.error('Discord client error:', error);
}
