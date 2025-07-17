export interface ErrorInfo {
	message: string;
	code?: string;
	timestamp: Date;
	context?: Record<string, unknown>;
}

export class AppError extends Error {
	public readonly code?: string;
	public readonly timestamp: Date;
	public readonly context?: Record<string, unknown>;

	constructor(message: string, code?: string, context?: Record<string, unknown>) {
		super(message);
		this.name = 'AppError';
		this.code = code;
		this.timestamp = new Date();
		this.context = context;
	}

	toJSON(): ErrorInfo {
		return {
			message: this.message,
			code: this.code,
			timestamp: this.timestamp,
			context: this.context
		};
	}
}

export class MediaError extends AppError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 'MEDIA_ERROR', context);
		this.name = 'MediaError';
	}
}

export class RecordingError extends AppError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 'RECORDING_ERROR', context);
		this.name = 'RecordingError';
	}
}

export class PlaybackError extends AppError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 'PLAYBACK_ERROR', context);
		this.name = 'PlaybackError';
	}
}

export class ProjectError extends AppError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 'PROJECT_ERROR', context);
		this.name = 'ProjectError';
	}
}

export class DatabaseError extends AppError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 'DATABASE_ERROR', context);
		this.name = 'DatabaseError';
	}
}

export class FileSystemError extends AppError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 'FILESYSTEM_ERROR', context);
		this.name = 'FileSystemError';
	}
}

export function createErrorHandler(context?: string) {
	return {
		handleError: (error: unknown, additionalContext?: Record<string, unknown>): AppError => {
			const errorContext = {
				...additionalContext,
				handlerContext: context
			};

			if (error instanceof AppError) {
				return error;
			}

			if (error instanceof Error) {
				return new AppError(error.message, 'UNKNOWN_ERROR', errorContext);
			}

			return new AppError(
				typeof error === 'string' ? error : 'An unknown error occurred',
				'UNKNOWN_ERROR',
				errorContext
			);
		},

		wrapAsync: <T extends unknown[], R>(
			fn: (...args: T) => Promise<R>
		): ((...args: T) => Promise<R>) => {
			return async (...args: T): Promise<R> => {
				try {
					return await fn(...args);
				} catch (error) {
					throw createErrorHandler(context).handleError(error);
				}
			};
		}
	};
}

export function isAppError(error: unknown): error is AppError {
	return error instanceof AppError;
}

export function formatErrorMessage(error: unknown): string {
	if (isAppError(error)) {
		return error.message;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return typeof error === 'string' ? error : 'An unknown error occurred';
}

export function logError(error: unknown, context?: string): void {
	const errorInfo = isAppError(error) ? error.toJSON() : {
		message: formatErrorMessage(error),
		timestamp: new Date(),
		context: { originalError: error }
	};

	console.error(`[${context || 'APP'}] Error:`, errorInfo);
}

// Browser-specific error handling
export function handleBrowserError(error: ErrorEvent): void {
	const appError = new AppError(
		error.message,
		'BROWSER_ERROR',
		{
			filename: error.filename,
			lineno: error.lineno,
			colno: error.colno,
			stack: error.error?.stack
		}
	);

	logError(appError, 'BROWSER');
}

export function handleUnhandledRejection(event: PromiseRejectionEvent): void {
	const appError = new AppError(
		'Unhandled promise rejection',
		'UNHANDLED_REJECTION',
		{
			reason: event.reason
		}
	);

	logError(appError, 'PROMISE');
}

// Initialize global error handlers
export function initializeErrorHandling(): void {
	if (typeof window !== 'undefined') {
		window.addEventListener('error', handleBrowserError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);
	}
}

// Cleanup global error handlers
export function cleanupErrorHandling(): void {
	if (typeof window !== 'undefined') {
		window.removeEventListener('error', handleBrowserError);
		window.removeEventListener('unhandledrejection', handleUnhandledRejection);
	}
}
