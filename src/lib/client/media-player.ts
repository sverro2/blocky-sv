import { opfsManager } from './opfs.js';

export class MediaPlayer {
	private static instance: MediaPlayer;
	private currentVideoElement: HTMLVideoElement | null = null;
	private currentMediaSource: MediaSource | null = null;
	private currentSourceBuffer: SourceBuffer | null = null;
	private chunkQueue: ArrayBuffer[] = [];
	private isAppending = false;
	private readonly CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks

	private constructor() {}

	public static getInstance(): MediaPlayer {
		if (!MediaPlayer.instance) {
			MediaPlayer.instance = new MediaPlayer();
		}
		return MediaPlayer.instance;
	}

	/**
	 * Plays a video file stored in OPFS by streaming it in 2MB chunks
	 * @param filePath - Path to the video file in OPFS
	 * @param videoElement - HTML video element to play the video in
	 * @param mimeType - MIME type of the video file (e.g., 'video/mp4')
	 */
	public async playMedia2(
		filePath: string,
		videoElement: HTMLVideoElement,
		mimeType: string = 'video/mp4'
	): Promise<void> {
		try {
			// Clean up any existing media source
			await this.cleanup();

			this.currentVideoElement = videoElement;

			// Check if MediaSource is supported
			if (!window.MediaSource) {
				throw new Error('MediaSource API is not supported in this browser');
			}

			// Get the file from OPFS
			const fileHandle = await opfsManager.getFileHandle(filePath);
			const file = await fileHandle.getFile();

			if (file.size === 0) {
				throw new Error('Video file is empty');
			}

			// Create MediaSource
			this.currentMediaSource = new MediaSource();
			const objectURL = URL.createObjectURL(this.currentMediaSource);
			videoElement.src = objectURL;

			// Wait for MediaSource to be ready
			await new Promise<void>((resolve, reject) => {
				if (!this.currentMediaSource) {
					reject(new Error('MediaSource is null'));
					return;
				}

				this.currentMediaSource.addEventListener(
					'sourceopen',
					() => {
						resolve();
					},
					{ once: true }
				);

				this.currentMediaSource.addEventListener(
					'error',
					(e) => {
						reject(new Error('MediaSource error: ' + e));
					},
					{ once: true }
				);
			});

			// Create SourceBuffer
			if (!this.currentMediaSource) {
				throw new Error('MediaSource is null after sourceopen');
			}

			try {
				this.currentSourceBuffer = this.currentMediaSource.addSourceBuffer(mimeType);
			} catch (error) {
				throw new Error(`Failed to create SourceBuffer with MIME type ${mimeType}: ${error}`);
			}

			// Set up SourceBuffer event listeners
			this.currentSourceBuffer.addEventListener('updateend', () => {
				this.processNextChunk();
			});

			this.currentSourceBuffer.addEventListener('error', (e) => {
				console.error('SourceBuffer error:', e);
			});

			// Start streaming the file in chunks
			await this.streamFileInChunks(file);

			// Clean up object URL
			URL.revokeObjectURL(objectURL);
		} catch (error) {
			console.error('Error in playMedia2:', error);
			await this.cleanup();
			throw error;
		}
	}

	/**
	 * Streams a file in chunks to the SourceBuffer
	 */
	private async streamFileInChunks(file: File): Promise<void> {
		const totalSize = file.size;
		let offset = 0;

		while (offset < totalSize) {
			const chunkSize = Math.min(this.CHUNK_SIZE, totalSize - offset);
			const chunk = file.slice(offset, offset + chunkSize);
			const arrayBuffer = await chunk.arrayBuffer();

			this.chunkQueue.push(arrayBuffer);
			offset += chunkSize;

			// Start processing if not already processing
			if (!this.isAppending) {
				this.processNextChunk();
			}
		}

		// Signal end of stream when all chunks are processed
		this.waitForAllChunksProcessed().then(() => {
			if (this.currentMediaSource && this.currentMediaSource.readyState === 'open') {
				this.currentMediaSource.endOfStream();
			}
		});
	}

	/**
	 * Processes the next chunk in the queue
	 */
	private processNextChunk(): void {
		if (this.isAppending || this.chunkQueue.length === 0 || !this.currentSourceBuffer) {
			return;
		}

		if (this.currentSourceBuffer.updating) {
			return;
		}

		const chunk = this.chunkQueue.shift();
		if (chunk) {
			try {
				this.isAppending = true;
				this.currentSourceBuffer.appendBuffer(chunk);
			} catch (error) {
				console.error('Error appending buffer:', error);
				this.isAppending = false;
			}
		}

		// Reset appending flag after the update
		if (this.currentSourceBuffer && !this.currentSourceBuffer.updating) {
			this.isAppending = false;
		}
	}

	/**
	 * Waits for all chunks to be processed
	 */
	private async waitForAllChunksProcessed(): Promise<void> {
		return new Promise((resolve) => {
			const checkQueue = () => {
				if (this.chunkQueue.length === 0 && !this.isAppending) {
					resolve();
				} else {
					setTimeout(checkQueue, 100);
				}
			};
			checkQueue();
		});
	}

	/**
	 * Stops playback and cleans up resources
	 */
	public async stop(): Promise<void> {
		if (this.currentVideoElement) {
			this.currentVideoElement.pause();
			this.currentVideoElement.src = '';
		}
		await this.cleanup();
	}

	/**
	 * Pauses playback
	 */
	public pause(): void {
		if (this.currentVideoElement) {
			this.currentVideoElement.pause();
		}
	}

	/**
	 * Resumes playback
	 */
	public play(): void {
		if (this.currentVideoElement) {
			this.currentVideoElement.play().catch(console.error);
		}
	}

	/**
	 * Gets the current playback time
	 */
	public getCurrentTime(): number {
		return this.currentVideoElement?.currentTime || 0;
	}

	/**
	 * Gets the duration of the current video
	 */
	public getDuration(): number {
		return this.currentVideoElement?.duration || 0;
	}

	/**
	 * Seeks to a specific time
	 */
	public seek(time: number): void {
		if (this.currentVideoElement) {
			this.currentVideoElement.currentTime = time;
		}
	}

	/**
	 * Cleans up resources
	 */
	private async cleanup(): Promise<void> {
		// Clear chunk queue
		this.chunkQueue = [];
		this.isAppending = false;

		// Clean up SourceBuffer
		if (this.currentSourceBuffer) {
			try {
				if (this.currentMediaSource && this.currentMediaSource.readyState === 'open') {
					this.currentMediaSource.removeSourceBuffer(this.currentSourceBuffer);
				}
			} catch (error) {
				console.warn('Error removing SourceBuffer:', error);
			}
			this.currentSourceBuffer = null;
		}

		// Clean up MediaSource
		if (this.currentMediaSource) {
			try {
				if (this.currentMediaSource.readyState === 'open') {
					this.currentMediaSource.endOfStream();
				}
			} catch (error) {
				console.warn('Error ending MediaSource stream:', error);
			}
			this.currentMediaSource = null;
		}

		this.currentVideoElement = null;
	}
}

// Export singleton instance
export const mediaPlayer = MediaPlayer.getInstance();
