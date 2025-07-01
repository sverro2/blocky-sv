<script lang="ts">
	import { MicIcon, PlayIcon, SaveIcon } from 'lucide-svelte';
	import { opfsManager } from '$lib/client/opfs';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();

	let filename = 'test-file';

	async function recordMedia() {
		let mediaDevices = window.navigator.mediaDevices;
		let constraints: MediaStreamConstraints = {
			video: true,
			audio: {
				sampleRate: 48000.0, // Probably not honored by most browsers
				sampleSize: 16.0,
				channelCount: 1.0,
				echoCancellation: false,
				noiseSuppression: true,
				autoGainControl: true
			}
		};

		let userMedia = await mediaDevices.getUserMedia(constraints);

		// Check for supported MIME types and use the best available
		let mimeType = 'video/webm; codecs="vp8, vorbis"';
		if (!MediaRecorder.isTypeSupported(mimeType)) {
			mimeType = 'video/webm; codecs="vp8"';
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
		console.log('Recording with MIME type:', mimeType || 'default');

		let recorderCacheDirHandle = await opfsManager.getDirectoryHandle('recorder-cache', {
			create: true
		});

		let testFileHandle = await recorderCacheDirHandle.getFileHandle(filename, { create: true });
		let testFileWritable = await testFileHandle.createWritable({ keepExistingData: false });

		recorder.addEventListener('dataavailable', async (ev: BlobEvent) => {
			console.log('Data available - size:', ev.data.size, 'type:', ev.data.type);
			await testFileWritable.write(ev.data);
		});

		recorder.addEventListener('stop', async () => {
			console.log('Recording stopped');
			await testFileWritable.close();
			console.log('File written and closed');
		});

		recorder.addEventListener('start', () => {
			console.log('Recording started');
		});

		recorder.addEventListener('error', (e) => {
			console.error('MediaRecorder error:', e);
		});

		// Record audio/video with timeslice of 5 seconds
		console.log('Starting recording for 15 seconds...');
		recorder.start(5000);

		setTimeout(() => {
			console.log('Stopping recording...');
			recorder.stop();
			// Stop all tracks to free up camera/mic
			userMedia.getTracks().forEach((track) => track.stop());
		}, 15000);
	}

	async function playMedia() {
		let videoComponent = window.document.getElementById('video-player')! as HTMLVideoElement;

		// Add video element error handlers
		videoComponent.addEventListener('error', (e) => {
			console.error('Video element error:', e);
			if (videoComponent.error) {
				console.error('Video error code:', videoComponent.error.code);
				console.error('Video error message:', videoComponent.error.message);
			}
		});

		videoComponent.addEventListener('loadstart', () => {
			console.log('Video load started');
		});

		videoComponent.addEventListener('loadedmetadata', () => {
			console.log('Video metadata loaded');
		});

		videoComponent.addEventListener('canplay', () => {
			console.log('Video can start playing');
		});

		let mediaSource = new MediaSource();
		videoComponent.src = URL.createObjectURL(mediaSource);

		mediaSource.addEventListener('sourceopen', async () => {
			console.log('this is source open');

			// Try to match the recording format, with fallbacks
			let mime = 'video/webm; codecs="vp8, vorbis"';
			if (!MediaSource.isTypeSupported(mime)) {
				mime = 'video/webm; codecs="vp8"';
				if (!MediaSource.isTypeSupported(mime)) {
					mime = 'video/webm';
					if (!MediaSource.isTypeSupported(mime)) {
						console.error('No supported WebM MIME types found');
						return;
					}
				}
			}
			console.log('Playing with MIME type:', mime);

			const sourceBuffer = mediaSource.addSourceBuffer(mime);

			let arrayBuffer: ArrayBuffer;
			try {
				const root = await navigator.storage.getDirectory();
				const cacheDir = await root.getDirectoryHandle('recorder-cache');
				const fileHandle = await cacheDir.getFileHandle(filename);
				const file = await fileHandle.getFile();
				arrayBuffer = await file.arrayBuffer();

				if (arrayBuffer.byteLength === 0) {
					console.error('File is empty');
					return;
				}
			} catch (err) {
				console.error('Error reading file:', err);
				return;
			}

			sourceBuffer.addEventListener(
				'updateend',
				() => {
					console.log(
						'updateend event - updating:',
						sourceBuffer.updating,
						'readyState:',
						mediaSource.readyState
					);
					if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
						try {
							mediaSource.endOfStream();
							console.log('MediaSource ended, attempting to play...');
							videoComponent
								.play()
								.then(() => {
									console.log('Video playback started successfully');
								})
								.catch((playErr) => {
									console.error('Video play error:', playErr);
								});
						} catch (err) {
							console.error('endOfStream error:', err);
						}
					}
				},
				{ once: true }
			);

			sourceBuffer.addEventListener('error', (e) => {
				console.error('SourceBuffer error:', e);
			});

			console.log('Appending buffer...');
			console.log(
				'Before append - updating:',
				sourceBuffer.updating,
				'readyState:',
				mediaSource.readyState
			);
			console.log('ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');

			try {
				sourceBuffer.appendBuffer(arrayBuffer);
				console.log(
					'After append - updating:',
					sourceBuffer.updating,
					'readyState:',
					mediaSource.readyState
				);
			} catch (appendError) {
				console.error('Error appending buffer:', appendError);
			}
		});

		mediaSource.addEventListener('sourceclose', () => {
			console.log('MediaSource closed');
		});

		mediaSource.addEventListener('sourceended', () => {
			console.log('MediaSource ended');
		});
	}
</script>

Hello {data.projectId}
<!-- svelte-ignore a11y_media_has_caption -->
<video id="video-player" autoplay controls class="bg-pink-300"></video>
<video id="video2" controls class="bg-pink-500" src="/test-file"></video>

<div class="text-foreground flex h-screen flex-col p-6">
	<div class="flex gap-2">
		<button
			onclick={recordMedia}
			class="flex gap-2 rounded-xl bg-red-500 px-5 py-2 transition duration-300 ease-in-out hover:bg-red-400 disabled:bg-gray-300"
		>
			<MicIcon />
			Record
			<!-- Conditional rendering based on `currently_recording()` and `recorded_media_signal.read().is_none()` -->
			<!-- If not recording and no media -->
			<!-- <svg>Mic icon</svg> -->
			<!-- Record -->
			<!-- Else -->
			<!-- <svg>RotateCw icon</svg> -->
			<!-- Retry -->
		</button>

		<button
			class="flex gap-2 rounded-xl bg-green-500 px-5 py-2 transition duration-300 ease-in-out hover:bg-green-400 disabled:bg-gray-300"
			disabled
		>
			<SaveIcon />
			Save
		</button>

		<button
			onclick={playMedia}
			class="flex gap-2 rounded-xl bg-green-500 px-5 py-2 transition duration-300 ease-in-out hover:bg-green-400 disabled:bg-gray-300"
		>
			<PlayIcon />
			Play
		</button>
	</div>

	<!-- BlocksInProjectList component -->
	<div class="my-10 flex flex-col gap-4">
		<!-- Repeat for each cached media item -->
		<div class="draggable flex max-w-96 place-content-between bg-yellow-400 p-3" draggable="true">
			<button class="cursor-pointer hover:text-green-600">play</button>
			<div>id of media</div>
			<button class="cursor-pointer text-red-500">x</button>
		</div>
		<!-- End repeat -->

		<!-- Conditional dragging message -->
		<!-- Right now, there is drag going on -->
		<!-- or -->
		<!-- No dragging -->
	</div>

	<!-- <Outlet /> -->
</div>
