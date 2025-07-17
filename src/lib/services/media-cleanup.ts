import { opfsManager } from '$lib/client/opfs';
import { removeMedia, getMediaById, isMediaUsedInOtherBlocks } from '$lib/client/idb';
import { FileSystemError } from '$lib/utils/error-handler';

export interface CleanupResult {
	success: boolean;
	mediaId: string;
	removedFromDatabase: boolean;
	removedFromStorage: boolean;
	error?: string;
}

export interface CleanupSummary {
	totalAttempted: number;
	totalSuccessful: number;
	totalFailed: number;
	results: CleanupResult[];
}

export class MediaCleanupService {
	private static instance: MediaCleanupService;

	private constructor() {}

	public static getInstance(): MediaCleanupService {
		if (!MediaCleanupService.instance) {
			MediaCleanupService.instance = new MediaCleanupService();
		}
		return MediaCleanupService.instance;
	}

	/**
	 * Safely removes a media file from both IndexedDB and OPFS storage
	 * Only removes if the media is not used in other blocks
	 */
	public async cleanupMedia(
		mediaId: string,
		projectId: string,
		excludeBlockId?: string
	): Promise<CleanupResult> {
		const result: CleanupResult = {
			success: false,
			mediaId,
			removedFromDatabase: false,
			removedFromStorage: false
		};

		try {
			// Check if media exists in database
			const mediaRecord = await getMediaById(mediaId);
			if (!mediaRecord) {
				result.error = 'Media not found in database';
				return result;
			}

			// Check if media is used in other blocks
			const isUsedElsewhere = await isMediaUsedInOtherBlocks(mediaId, projectId, excludeBlockId);
			if (isUsedElsewhere) {
				result.error = 'Media is still used in other blocks';
				return result;
			}

			// Remove from IndexedDB
			await removeMedia(mediaId);
			result.removedFromDatabase = true;

			// Remove from OPFS storage
			await this.removeFromOPFS(mediaId);
			result.removedFromStorage = true;

			result.success = true;
			console.log(`Successfully cleaned up media: ${mediaId}`);
		} catch (error) {
			result.error = error instanceof Error ? error.message : 'Unknown cleanup error';
			console.error(`Failed to cleanup media ${mediaId}:`, error);
		}

		return result;
	}

	/**
	 * Removes a media file from OPFS storage
	 */
	private async removeFromOPFS(mediaId: string): Promise<void> {
		try {
			const recorderCacheDir = await opfsManager.getDirectoryHandle('recorder-cache');
			await recorderCacheDir.removeEntry(mediaId);
		} catch (error) {
			// If file doesn't exist, that's fine
			if (error instanceof DOMException && error.name === 'NotFoundError') {
				console.warn(`Media file ${mediaId} not found in OPFS, may have been already removed`);
				return;
			}
			throw new FileSystemError(`Failed to remove media file ${mediaId} from OPFS`, {
				mediaId,
				originalError: error
			});
		}
	}

	/**
	 * Cleans up multiple media files
	 */
	public async cleanupMultipleMedia(
		mediaIds: string[],
		projectId: string,
		excludeBlockId?: string
	): Promise<CleanupSummary> {
		const results: CleanupResult[] = [];

		for (const mediaId of mediaIds) {
			const result = await this.cleanupMedia(mediaId, projectId, excludeBlockId);
			results.push(result);
		}

		const summary: CleanupSummary = {
			totalAttempted: mediaIds.length,
			totalSuccessful: results.filter((r) => r.success).length,
			totalFailed: results.filter((r) => !r.success).length,
			results
		};

		console.log('Cleanup summary:', summary);
		return summary;
	}

	/**
	 * Cleans up all media files associated with a block
	 */
	public async cleanupBlockMedia(
		mediaIds: string[],
		projectId: string,
		blockId: string
	): Promise<CleanupSummary> {
		return this.cleanupMultipleMedia(mediaIds, projectId, blockId);
	}

	/**
	 * Finds orphaned media files (in OPFS but not in any project)
	 */
	public async findOrphanedMedia(projectId: string): Promise<string[]> {
		try {
			const orphanedFiles: string[] = [];
			const recorderCacheDir = await opfsManager.getDirectoryHandle('recorder-cache');

			// Get all files in OPFS
			const opfsFiles: string[] = [];
			for await (const [name, handle] of recorderCacheDir.entries()) {
				if (handle.kind === 'file') {
					opfsFiles.push(name);
				}
			}

			// Check each file to see if it's referenced in the project
			for (const filename of opfsFiles) {
				const mediaRecord = await getMediaById(filename);
				if (!mediaRecord || mediaRecord.projectId !== projectId) {
					// File exists in OPFS but not in database for this project
					orphanedFiles.push(filename);
				} else {
					// File exists in database, check if it's used in any blocks
					const isUsed = await isMediaUsedInOtherBlocks(filename, projectId);
					if (!isUsed) {
						orphanedFiles.push(filename);
					}
				}
			}

			return orphanedFiles;
		} catch (error) {
			console.error('Failed to find orphaned media:', error);
			return [];
		}
	}

	/**
	 * Cleans up all orphaned media files for a project
	 */
	public async cleanupOrphanedMedia(projectId: string): Promise<CleanupSummary> {
		const orphanedFiles = await this.findOrphanedMedia(projectId);
		return this.cleanupMultipleMedia(orphanedFiles, projectId);
	}

	/**
	 * Gets storage usage statistics
	 */
	public async getStorageStats(): Promise<{
		totalFiles: number;
		totalSizeBytes: number;
		files: Array<{ name: string; size: number }>;
	}> {
		try {
			const recorderCacheDir = await opfsManager.getDirectoryHandle('recorder-cache');
			const files: Array<{ name: string; size: number }> = [];
			let totalSizeBytes = 0;

			for await (const [name, handle] of recorderCacheDir.entries()) {
				if (handle.kind === 'file') {
					const fileHandle = handle as FileSystemFileHandle;
					const file = await fileHandle.getFile();
					const size = file.size;
					files.push({ name, size });
					totalSizeBytes += size;
				}
			}

			return {
				totalFiles: files.length,
				totalSizeBytes,
				files
			};
		} catch (error) {
			console.error('Failed to get storage stats:', error);
			return {
				totalFiles: 0,
				totalSizeBytes: 0,
				files: []
			};
		}
	}

	/**
	 * Formats bytes to human readable string
	 */
	public formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';

		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
}

export const mediaCleanupService = MediaCleanupService.getInstance();
