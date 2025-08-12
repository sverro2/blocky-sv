import { consola } from 'consola';
import { dev } from '$app/environment';

export const logger = consola.create({
	level: dev ? 4 : 2, // debug in dev, warn+ in prod
	formatOptions: {
		colors: true,
		date: true
	}
});

// Convenience methods for common patterns
export const logAuth = (message: string, data?: unknown) => logger.info(`[AUTH] ${message}`, data);

export const logMedia = (message: string, data?: unknown) =>
	logger.debug(`[MEDIA] ${message}`, data);

export const logDb = (message: string, data?: unknown) => logger.debug(`[DB] ${message}`, data);
