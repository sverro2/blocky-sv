<script lang="ts">
	import { MicIcon, SaveIcon } from 'lucide-svelte';
	import { opfsManager } from '$lib/client/opfs';
	import type { MediaRecorderSession } from '$lib/types/current-recorder-session';
	import { addMedia } from '$lib/client/idb';
	import { logMedia } from '$lib/utils/logger';

	interface Props {
		projectId: string;
		onRecordingComplete?: () => void;
	}

	let { projectId, onRecordingComplete }: Props = $props();

	let recorderSession = $state<MediaRecorderSession | null>(null);
	let isRecording = $derived(recorderSession !== null);

	async function recordMedia() {
		let mediaDevices = window.navigator.mediaDevices;
		let constraints: MediaStreamConstraints = {
			video: false,
			audio: {
				sampleRate: 48000.0, // Probably not honored by most browsers
				sampleSize: 16.0,
				channelCount: 1.0,
				echoCancellation: false,
				noiseSuppression: false,
				autoGainControl: true
			}
		};

		let userMedia = await mediaDevices.getUserMedia(constraints);

		// Check for supported MIME types and use the best available
		// let mimeType = 'video/webm; codecs="vp8, opus"';
		let mimeType = 'audio/webm; codecs=opus';
		if (!MediaRecorder.isTypeSupported(mimeType)) {
			mimeType = 'video/webm; codecs="vp8, vorbis"';
			if (!MediaRecorder.isTypeSupported(mimeType)) {
				mimeType = 'video/webm';
				if (!MediaRecorder.isTypeSupported(mimeType)) {
					console.warn('WebM not supported, falling back to default');
					mimeType = '';
				}
			}
		}

		let recorder = mimeType
			? new MediaRecorder(userMedia, { mimeType })
			: new MediaRecorder(userMedia);
		logMedia('Recording with MIME type:', mimeType || 'default');

		let filename = crypto.randomUUID();

		recorderSession = {
			mediaRecorder: recorder,
			mediaDevices: userMedia,
			filename
		};

		let recorderCacheDirHandle = await opfsManager.getDirectoryHandle('recorder-cache', {
			create: true
		});

		let testFileHandle = await recorderCacheDirHandle.getFileHandle(filename, { create: true });
		let testFileWritable = await testFileHandle.createWritable({ keepExistingData: false });

		recorder.addEventListener('dataavailable', async (ev: BlobEvent) => {
			await testFileWritable.write(ev.data);
		});

		recorder.addEventListener('stop', async () => {
			await testFileWritable.close();
			console.log('Recording finished');
		});

		recorder.addEventListener('error', (e) => {
			console.error('MediaRecorder error:', e);
		});

		// Record audio/video with timeslice of 5 seconds
		recorder.start(5000);
	}

	async function stopRecording() {
		if (recorderSession === null) {
			return;
		}

		recorderSession.mediaRecorder.stop();

		// Stop all tracks to free up camera/mic
		recorderSession.mediaDevices.getTracks().forEach((track) => track.stop());

		await addMedia({ mediaId: recorderSession.filename, projectId });

		recorderSession = null;

		if (onRecordingComplete) {
			onRecordingComplete();
		}
	}
</script>

<div class="flex gap-2">
	<button
		onclick={recordMedia}
		disabled={isRecording}
		class="flex gap-2 rounded-xl bg-red-500 px-5 py-2 transition duration-300 ease-in-out hover:bg-red-400 disabled:bg-gray-300"
	>
		<MicIcon />
		Record
	</button>
	<button
		disabled={!isRecording}
		onclick={stopRecording}
		class="flex gap-2 rounded-xl bg-green-500 px-5 py-2 transition duration-300 ease-in-out hover:bg-green-400 disabled:bg-gray-300"
	>
		<SaveIcon />
		Save
	</button>
</div>
