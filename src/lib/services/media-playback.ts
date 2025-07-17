import { opfsManager } from '$lib/client/opfs';
import type { Block } from '$lib/client/idb';

export interface PlaybackState {
	isPlaying: boolean;
	currentBlockId: string | null;
	currentPosition: number;
	totalDuration: number;
	currentBlockIndex: number;
	totalBlocks: number;
}

export class MediaPlaybackService {
	private static instance: MediaPlaybackService;
	private videoElement: HTMLVideoElement | null = null;
	private mediaSource: MediaSource | null = null;
	private sourceBuffer: SourceBuffer | null = null;
	private currentPlaylist: Block[] = [];
	private currentIndex: number = 0;
	private playbackState: PlaybackState = {
		isPlaying: false,
		currentBlockId: null,
		currentPosition: 0,
		totalDuration: 0,
		currentBlockIndex: 0,
		totalBlocks: 0
	};
	private blockStartTimes: number[] = [];
	private onBlockChangeCallback: ((blockId: string, blockIndex: number) => void) | null = null;

	private constructor() {}

	public static getInstance(): MediaPlaybackService {
		if (!MediaPlaybackService.instance) {
			MediaPlaybackService.instance = new MediaPlaybackService();
		}
		return MediaPlaybackService.instance;
	}

	public get state(): PlaybackState {
		return { ...this.playbackState };
	}

	public setVideoElement(element: HTMLVideoElement): void {
		this.videoElement = element;
		this.setupVideoEventHandlers();
	}

	public async playFromBlock(startBlockId: string, blocks: Block[]): Promise<void> {
		if (!this.videoElement) {
			throw new Error('Video element not set');
		}

		const startIndex = blocks.findIndex((block) => block.blockId === startBlockId);
		if (startIndex === -1) {
			throw new Error(`Block with ID ${startBlockId} not found`);
		}

		this.currentPlaylist = blocks.slice(startIndex);
		this.currentIndex = 0;
		this.playbackState.currentBlockId = startBlockId;
		this.playbackState.currentBlockIndex = 0;
		this.playbackState.totalBlocks = this.currentPlaylist.length;
		this.blockStartTimes = [0]; // First block starts at 0

		await this.initializeMediaSource();
		await this.loadMediaSequence();
	}

	public pause(): void {
		this.videoElement?.pause();
	}

	public play(): void {
		this.videoElement?.play();
	}

	public stop(): void {
		this.videoElement?.pause();
		if (this.videoElement) {
			this.videoElement.currentTime = 0;
		}
		this.cleanupMediaSource();
		this.playbackState.isPlaying = false;
		this.playbackState.currentBlockId = null;
		this.playbackState.currentBlockIndex = 0;
		this.playbackState.totalBlocks = 0;
	}

	public setBlockChangeCallback(callback: (blockId: string, blockIndex: number) => void): void {
		this.onBlockChangeCallback = callback;
	}

	private setupVideoEventHandlers(): void {
		if (!this.videoElement) return;

		this.videoElement.addEventListener('play', () => {
			this.playbackState.isPlaying = true;
			console.log('Playback started');
		});

		this.videoElement.addEventListener('pause', () => {
			this.playbackState.isPlaying = false;
			console.log('Playback paused');
		});

		this.videoElement.addEventListener('timeupdate', () => {
			if (this.videoElement) {
				this.playbackState.currentPosition = this.videoElement.currentTime;
				this.updateCurrentBlock();
			}
		});

		this.videoElement.addEventListener('ended', () => {
			this.playbackState.isPlaying = false;
			console.log('Playback ended');
		});

		this.videoElement.addEventListener('error', (e) => {
			console.error('Video element error:', e);
			this.handlePlaybackError(e);
		});

		this.videoElement.addEventListener('loadstart', () => {
			console.log('Video load started');
		});

		this.videoElement.addEventListener('loadedmetadata', () => {
			console.log('Video metadata loaded');
			if (this.videoElement) {
				this.playbackState.totalDuration = this.videoElement.duration;
			}
		});

		this.videoElement.addEventListener('canplay', () => {
			console.log('Video can start playing');
		});
	}

	private async initializeMediaSource(): Promise<void> {
		if (!this.videoElement) {
			throw new Error('Video element not set');
		}

		this.cleanupMediaSource();

		this.mediaSource = new MediaSource();
		this.videoElement.src = URL.createObjectURL(this.mediaSource);

		return new Promise((resolve, reject) => {
			if (!this.mediaSource) {
				reject(new Error('MediaSource not initialized'));
				return;
			}

			this.mediaSource.addEventListener('sourceopen', async () => {
				try {
					await this.setupSourceBuffer();
					resolve();
				} catch (error) {
					reject(error);
				}
			});

			this.mediaSource.addEventListener('sourceclose', () => {
				console.log('MediaSource closed');
			});

			this.mediaSource.addEventListener('sourceended', () => {
				console.log('MediaSource ended');
			});
		});
	}

	private async setupSourceBuffer(): Promise<void> {
		if (!this.mediaSource) {
			throw new Error('MediaSource not initialized');
		}

		const mimeType = this.getSupportedMimeType();
		console.log('Playing with MIME type:', mimeType);

		this.sourceBuffer = this.mediaSource.addSourceBuffer(mimeType);
		this.sourceBuffer.mode = 'sequence';

		this.sourceBuffer.addEventListener('error', (e) => {
			console.error('SourceBuffer error:', e);
		});
	}

	private getSupportedMimeType(): string {
		const mimeTypes = ['audio/webm; codecs=opus', 'video/webm; codecs="vp8"', 'video/webm'];

		for (const mimeType of mimeTypes) {
			if (MediaSource.isTypeSupported(mimeType)) {
				return mimeType;
			}
		}

		throw new Error('No supported WebM MIME types found');
	}

	private async loadMediaSequence(): Promise<void> {
		if (!this.sourceBuffer || !this.mediaSource) {
			throw new Error('MediaSource or SourceBuffer not initialized');
		}

		this.currentIndex = 0;
		await this.appendNextMedia();
	}

	private async appendNextMedia(): Promise<void> {
		if (!this.sourceBuffer || !this.mediaSource) {
			return;
		}

		if (this.currentIndex >= this.currentPlaylist.length) {
			this.finalizePlayback();
			return;
		}

		const currentBlock = this.currentPlaylist[this.currentIndex];
		const mediaId = currentBlock.currentMediaId;

		try {
			const cacheDir = await opfsManager.getDirectoryHandle('recorder-cache');
			const fileHandle = await cacheDir.getFileHandle(mediaId);
			const file = await fileHandle.getFile();
			const arrayBuffer = await file.arrayBuffer();

			const appendNextCallback = () => {
				this.sourceBuffer?.removeEventListener('updateend', appendNextCallback);

				// Track when this block was added to calculate start times
				if (this.videoElement && this.sourceBuffer) {
					const buffered = this.sourceBuffer.buffered;
					if (buffered.length > 0) {
						const endTime = buffered.end(buffered.length - 1);
						// Next block will start at the current end time
						if (this.currentIndex + 1 < this.currentPlaylist.length) {
							this.blockStartTimes.push(endTime);
						}
					}
				}

				this.currentIndex++;
				this.appendNextMedia();
			};

			this.sourceBuffer.addEventListener('updateend', appendNextCallback);
			this.sourceBuffer.appendBuffer(arrayBuffer);
		} catch (error) {
			console.error('Error loading media:', error);
			this.handlePlaybackError(error);
		}
	}

	private finalizePlayback(): void {
		if (!this.mediaSource || !this.sourceBuffer) {
			return;
		}

		try {
			this.mediaSource.endOfStream();
			console.log('MediaSource ended, attempting to play...');

			if (this.videoElement && this.playbackState.isPlaying) {
				this.videoElement
					.play()
					.then(() => {
						console.log('Video playback started successfully');
					})
					.catch((error) => {
						console.error('Video play error:', error);
					});
			}
		} catch (error) {
			console.error('endOfStream error:', error);
		}
	}

	private cleanupMediaSource(): void {
		if (this.mediaSource) {
			if (this.mediaSource.readyState === 'open') {
				try {
					this.mediaSource.endOfStream();
				} catch (error) {
					console.warn('Error ending media source:', error);
				}
			}
			this.mediaSource = null;
		}
		this.sourceBuffer = null;
	}

	private handlePlaybackError(error: unknown): void {
		console.error('Playback error:', error);
		this.playbackState.isPlaying = false;
		this.cleanupMediaSource();
	}

	private updateCurrentBlock(): void {
		if (!this.videoElement || this.blockStartTimes.length === 0) {
			return;
		}

		const currentTime = this.videoElement.currentTime;
		let newBlockIndex = 0;

		// Find which block we're currently in based on start times
		for (let i = this.blockStartTimes.length - 1; i >= 0; i--) {
			if (currentTime >= this.blockStartTimes[i]) {
				newBlockIndex = i;
				break;
			}
		}

		// Update current block if it changed
		if (newBlockIndex !== this.playbackState.currentBlockIndex) {
			this.playbackState.currentBlockIndex = newBlockIndex;
			if (newBlockIndex < this.currentPlaylist.length) {
				const newCurrentBlock = this.currentPlaylist[newBlockIndex];
				const oldBlockId = this.playbackState.currentBlockId;
				this.playbackState.currentBlockId = newCurrentBlock.blockId;

				console.log(
					`Now playing block ${newBlockIndex + 1}/${this.currentPlaylist.length}: ${newCurrentBlock.blockId}`
				);

				// Notify about block change
				if (this.onBlockChangeCallback && oldBlockId !== newCurrentBlock.blockId) {
					this.onBlockChangeCallback(newCurrentBlock.blockId, newBlockIndex);
				}
			}
		}
	}
}

export const mediaPlaybackService = MediaPlaybackService.getInstance();
