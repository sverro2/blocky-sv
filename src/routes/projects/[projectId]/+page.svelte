<script lang="ts">
	import { MicIcon, PlayIcon, SaveIcon } from 'lucide-svelte';
	import { opfsManager } from '$lib/client/opfs';
	import { reorder, useSortable } from '$lib/client/use-sortable.svelte';
	import type { MediaRecorderSession } from '$lib/types/current-recorder-session';
	import { addMedia, getAllMediaForProject, type CachedMedia } from '$lib/client/idb';

	import type { PageProps } from './$types';
	import { onMount } from 'svelte';
	let { data }: PageProps = $props();

	let items = $state<CachedMedia[]>([]);

	let recorderSession = $state<MediaRecorderSession | null>(null);
	let isRecording = $derived(recorderSession !== null);

	let sortable = $state<HTMLElement | null>(null);

	onMount(async () => {
		await refreshItems();
	});

	async function refreshItems() {
		let media = await getAllMediaForProject(data.projectId);
		items = media;
	}

	useSortable(() => sortable, {
		animation: 200,
		// handle: '.my-handle',
		ghostClass: 'dragged-item',
		delayOnTouchOnly: true,
		delay: 200,
		onEnd(evt) {
			items = reorder(items, evt);
		}
	});

	async function recordMedia() {
		let mediaDevices = window.navigator.mediaDevices;
		let constraints: MediaStreamConstraints = {
			video: false,
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
		console.log('Recording with MIME type:', mimeType || 'default');

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

		await addMedia({ mediaId: recorderSession.filename, projectId: data.projectId });

		recorderSession = null;
		await refreshItems();
	}

	async function playMedia(startFromIndex: number) {
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
			let mime = 'video/webm; codecs="vp8, opus"';
			// let mime = 'audio/webm; codecs=opus';
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
				const fileHandle = await cacheDir.getFileHandle(`${startFromIndex}`);
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

			sourceBuffer.addEventListener('updateend', () => {
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
			});

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

	async function listFiles() {
		const folderHandle = await opfsManager.getDirectoryHandle('recorder-cache');

		// List files in that folder
		for await (const handle of folderHandle.values()) {
			if (handle.kind === 'file') {
				console.log('File:', handle.name);
			} else if (handle.kind === 'directory') {
				console.log('Directory:', handle.name);
			}
		}
	}
</script>

<!-- Hello {data.projectId} -->
<!-- svelte-ignore a11y_media_has_caption -->
<video id="video-player" autoplay controls class="bg-gray-700"></video>

<div class="text-foreground flex h-screen flex-col p-6">
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

	<ul class="flex w-full list-none flex-col" bind:this={sortable}>
		{#each items as item (item.mediaId)}
			<li class="m-2 flex w-96 items-center justify-center gap-5 border p-3">
				<button type="button" class="my-handle outline-none">
					<!-- <Handle /> -->play
				</button>
				<span>{item.mediaId}</span>
				<button type="button" class="my-handle outline-none">
					<!-- <Handle /> -->han
				</button>
			</li>
		{/each}
	</ul>
	<!-- <div class="flex justify-center">
		<pre class="mt-5 w-fit border p-5">{JSON.stringify(items, null, 2)}</pre>
	</div> -->

	<!-- <Outlet /> -->
</div>
