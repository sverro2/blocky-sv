import { opfsManager } from '$lib/client/opfs';
import type { MediaRecorderSession } from '$lib/types/current-recorder-session';

export class MediaRecordingService {
	private static instance: MediaRecordingService;
	private currentSession: MediaRecorderSession | null = null;

	private constructor() {}

	public static getInstance(): MediaRecordingService {
		if (!MediaRecordingService.instance) {
			MediaRecordingService.instance = new MediaRecordingService();
		}
		return MediaRecordingService.instance;
	}

	public get isRecording(): boolean {
		return this.currentSession !== null;
	}

	public get currentSessionId(): string | null {
		return this.currentSession?.filename || null;
	}

	public async startRecording(): Promise<string> {
		if (this.currentSession) {
			throw new Error('Recording already in progress');
		}

		const mediaDevices = window.navigator.mediaDevices;
		const constraints: MediaStreamConstraints = {
			video: false,
			audio: {
				sampleRate: 48000.0,
				sampleSize: 16.0,
				channelCount: 1.0,
				echoCancellation: false,
				noiseSuppression: true,
				autoGainControl: true
			}
		};

		const userMedia = await mediaDevices.getUserMedia(constraints);
		const mimeType = this.getSupportedMimeType();
		const filename = crypto.randomUUID();

		const recorder = mimeType
			? new MediaRecorder(userMedia, { mimeType })
			: new MediaRecorder(userMedia);

		console.log('Recording with MIME type:', mimeType || 'default');

		this.currentSession = {
			mediaRecorder: recorder,
			mediaDevices: userMedia,
			filename
		};

		await this.setupRecorderHandlers(recorder, filename);
		recorder.start(5000); // 5 second timeslice

		return filename;
	}

	public async stopRecording(): Promise<string> {
		if (!this.currentSession) {
			throw new Error('No recording in progress');
		}

		const filename = this.currentSession.filename;

		this.currentSession.mediaRecorder.stop();
		this.currentSession.mediaDevices.getTracks().forEach((track) => track.stop());

		this.currentSession = null;

		return filename;
	}

	private getSupportedMimeType(): string {
		const mimeTypes = [
			'audio/webm; codecs=opus',
			'video/webm; codecs="vp8, vorbis"',
			'video/webm'
		];

		for (const mimeType of mimeTypes) {
			if (MediaRecorder.isTypeSupported(mimeType)) {
				return mimeType;
			}
		}

		console.warn('No preferred MIME types supported, using default');
		return '';
	}

	private async setupRecorderHandlers(recorder: MediaRecorder, filename: string): Promise<void> {
		const recorderCacheDirHandle = await opfsManager.getDirectoryHandle('recorder-cache', {
			create: true
		});

		const fileHandle = await recorderCacheDirHandle.getFileHandle(filename, { create: true });
		const writable = await fileHandle.createWritable({ keepExistingData: false });

		recorder.addEventListener('dataavailable', async (ev: BlobEvent) => {
			await writable.write(ev.data);
		});

		recorder.addEventListener('stop', async () => {
			await writable.close();
			console.log('Recording finished');
		});

		recorder.addEventListener('error', (e) => {
			console.error('MediaRecorder error:', e);
			this.currentSession = null;
		});
	}
}

export const mediaRecordingService = MediaRecordingService.getInstance();
