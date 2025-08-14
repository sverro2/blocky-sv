<script lang="ts">
	import { opfsManager } from '$lib/client/opfs';
	import type { Block } from '$lib/client/idb';

	interface Props {
		blocks: Block[];
		selectedMediaId?: string | null;
		onPlayingStateChange?: (isPlaying: boolean) => void;
	}

	let { blocks, selectedMediaId, onPlayingStateChange }: Props = $props();

	let isPlaying = $state(false);
	let videoElement = $state<HTMLVideoElement | null>(null);

	$effect(() => {
		if (onPlayingStateChange) {
			onPlayingStateChange(isPlaying);
		}
	});

	export async function playMedia() {
		let indexOfStartSong = blocks.findIndex((x) => x.currentMediaId == selectedMediaId);
		let toBeplayed = blocks.slice(indexOfStartSong);

		console.log(toBeplayed);

		if (!videoElement) {
			console.error('Video element not found');
			return;
		}

		// Add video element error handlers
		videoElement.addEventListener('error', (e) => {
			console.error('Video element error:', e);
			if (videoElement?.error) {
				console.error('Video error code:', videoElement.error.code);
				console.error('Video error message:', videoElement.error.message);
			}
		});

		videoElement.addEventListener('loadstart', () => {
			console.log('Video load started');
		});

		videoElement.addEventListener('loadedmetadata', () => {
			console.log('Video metadata loaded');
		});

		videoElement.addEventListener('canplay', () => {
			console.log('Video can start playing');
		});

		videoElement.addEventListener('play', () => {
			console.log('playing for some reason');
			isPlaying = true;
		});
		videoElement.addEventListener('pause', () => {
			console.log('pausing for some reason');
			isPlaying = false;
		});

		let mediaSource = new MediaSource();
		videoElement.src = URL.createObjectURL(mediaSource);

		mediaSource.addEventListener('sourceopen', async () => {
			console.log('this is source open');

			// Try to match the recording format, with fallbacks
			// let mime = 'video/webm; codecs="vp8, opus"';
			let mime = 'audio/webm; codecs=opus';
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
			sourceBuffer.mode = 'sequence';

			const cacheDir = await opfsManager.getDirectoryHandle('recorder-cache');

			let currentIndex = 0;

			let offset = 0;

			async function addMedia() {
				let currentMedia = toBeplayed[currentIndex].currentMediaId;
				const fileHandle = await cacheDir.getFileHandle(currentMedia);
				const file = await fileHandle.getFile();
				let arrayBuffer = await file.arrayBuffer();

				if (offset !== 0) {
					console.log('did the thing!');
					// sourceBuffer.timestampOffset = offset;
					console.log('you are upset');
				}

				sourceBuffer.appendBuffer(arrayBuffer);
				currentIndex++;
				offset += 3;
			}

			sourceBuffer.addEventListener('updateend', () => {
				if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
					if (currentIndex < toBeplayed.length) {
						console.log('appended the thing');
						addMedia();
					} else {
						try {
							mediaSource.endOfStream();
							console.log('MediaSource ended, attempting to play...');
							if (isPlaying === true && videoElement) {
								videoElement
									.play()
									.then(() => {
										console.log('Video playback started successfully');
									})
									.catch((playErr) => {
										console.error('Video play error:', playErr);
									});
							}
						} catch (err) {
							console.error('endOfStream error:', err);
						}
					}
				}
			});

			addMedia();

			sourceBuffer.addEventListener('error', (e) => {
				console.error('SourceBuffer error:', e);
			});
		});

		mediaSource.addEventListener('sourceclose', () => {
			console.log('MediaSource closed');
		});

		mediaSource.addEventListener('sourceended', () => {
			console.log('MediaSource ended');
		});
	}
</script>

<!-- <video bind:this={videoElement} id="video-player" controls class="bg-gray-700"></video> -->
<!-- svelte-ignore a11y_media_has_caption -->
<video class="h-1/3 w-full bg-blue-300 sm:w-auto lg:w-full">Player stub</video>
