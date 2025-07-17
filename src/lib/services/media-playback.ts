import { opfsManager } from '$lib/client/opfs';
import type { Block } from '$lib/client/idb';

export interface PlaybackState {
	isPlaying: boolean;
	currentBlockId: string | null;
	currentPosition: number;
	totalDuration: number;
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
		totalDuration: 0
	};

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
}

export const mediaPlaybackService = MediaPlaybackService.getInstance();
