<script lang="ts">
	import { opfsManager } from '$lib/client/opfs';
	import type { Block } from '$lib/client/idb';
	import { Button } from '$lib/components/ui/button';
	import {
		SkipBack,
		Play,
		Pause,
		SkipForward,
		VolumeX,
		Edit,
		StepForward,
		StepBack
	} from 'lucide-svelte';

	interface Props {
		projectId: string;
		blocks: BlockListItem[];
		selectedBlockId?: string | null;
		onPlayingStateChange?: (isPlaying: boolean) => void;
		showEditButton: boolean;
	}

	let { projectId, blocks, selectedBlockId, onPlayingStateChange, showEditButton }: Props =
		$props();

	let selectedBlock = $derived(blocks.find((block) => block.id === selectedBlockId));
	let selectedBlockIndex = $derived(blocks.findIndex((block) => block.id === selectedBlockId));
	let selectedBlockNumber = $derived(selectedBlockIndex + 1);

	let isPlaying = $state(false);
	let isMuted = $state(false);
	let videoElement = $state<HTMLVideoElement | null>(null);

	// Control button states
	let firstBlockId = $derived(blocks[0].id);
	let lastBlockId = $derived(blocks[blocks.length - 1].id);
	let canGoToStart = $derived(selectedBlockId !== firstBlockId);
	let canGoBack = $derived(selectedBlockId !== firstBlockId);
	let canGoForward = $derived(selectedBlockId !== lastBlockId);
	let canGoToEnd = $derived(selectedBlockId !== lastBlockId);

	$effect(() => {
		if (onPlayingStateChange) {
			onPlayingStateChange(isPlaying);
		}
	});

	export async function playMedia() {
		// let indexOfStartSong = blocks.findIndex((x) => x.currentMediaId == selectedMediaId);
		// let toBeplayed = blocks.slice(indexOfStartSong);
		// console.log(toBeplayed);
		// if (!videoElement) {
		// 	console.error('Video element not found');
		// 	return;
		// }
		// // Add video element error handlers
		// videoElement.addEventListener('error', (e) => {
		// 	console.error('Video element error:', e);
		// 	if (videoElement?.error) {
		// 		console.error('Video error code:', videoElement.error.code);
		// 		console.error('Video error message:', videoElement.error.message);
		// 	}
		// });
		// videoElement.addEventListener('loadstart', () => {
		// 	console.log('Video load started');
		// });
		// videoElement.addEventListener('loadedmetadata', () => {
		// 	console.log('Video metadata loaded');
		// });
		// videoElement.addEventListener('canplay', () => {
		// 	console.log('Video can start playing');
		// });
		// videoElement.addEventListener('play', () => {
		// 	console.log('playing for some reason');
		// 	isPlaying = true;
		// });
		// videoElement.addEventListener('pause', () => {
		// 	console.log('pausing for some reason');
		// 	isPlaying = false;
		// });
		// let mediaSource = new MediaSource();
		// videoElement.src = URL.createObjectURL(mediaSource);
		// mediaSource.addEventListener('sourceopen', async () => {
		// 	console.log('this is source open');
		// 	// Try to match the recording format, with fallbacks
		// 	// let mime = 'video/webm; codecs="vp8, opus"';
		// 	let mime = 'audio/webm; codecs=opus';
		// 	if (!MediaSource.isTypeSupported(mime)) {
		// 		mime = 'video/webm; codecs="vp8"';
		// 		if (!MediaSource.isTypeSupported(mime)) {
		// 			mime = 'video/webm';
		// 			if (!MediaSource.isTypeSupported(mime)) {
		// 				console.error('No supported WebM MIME types found');
		// 				return;
		// 			}
		// 		}
		// 	}
		// 	console.log('Playing with MIME type:', mime);
		// 	const sourceBuffer = mediaSource.addSourceBuffer(mime);
		// 	sourceBuffer.mode = 'sequence';
		// 	const cacheDir = await opfsManager.getDirectoryHandle('recorder-cache');
		// 	let currentIndex = 0;
		// 	let offset = 0;
		// 	async function addMedia() {
		// 		let currentMedia = toBeplayed[currentIndex].currentMediaId;
		// 		const fileHandle = await cacheDir.getFileHandle(currentMedia);
		// 		const file = await fileHandle.getFile();
		// 		let arrayBuffer = await file.arrayBuffer();
		// 		if (offset !== 0) {
		// 			console.log('did the thing!');
		// 			// sourceBuffer.timestampOffset = offset;
		// 			console.log('you are upset');
		// 		}
		// 		sourceBuffer.appendBuffer(arrayBuffer);
		// 		currentIndex++;
		// 		offset += 3;
		// 	}
		// 	sourceBuffer.addEventListener('updateend', () => {
		// 		if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
		// 			if (currentIndex < toBeplayed.length) {
		// 				console.log('appended the thing');
		// 				addMedia();
		// 			} else {
		// 				try {
		// 					mediaSource.endOfStream();
		// 					console.log('MediaSource ended, attempting to play...');
		// 					if (isPlaying === true && videoElement) {
		// 						videoElement
		// 							.play()
		// 							.then(() => {
		// 								console.log('Video playback started successfully');
		// 							})
		// 							.catch((playErr) => {
		// 								console.error('Video play error:', playErr);
		// 							});
		// 					}
		// 				} catch (err) {
		// 					console.error('endOfStream error:', err);
		// 				}
		// 			}
		// 		}
		// 	});
		// 	addMedia();
		// 	sourceBuffer.addEventListener('error', (e) => {
		// 		console.error('SourceBuffer error:', e);
		// 	});
		// 	});
		// 	mediaSource.addEventListener('sourceclose', () => {
		// 		console.log('MediaSource closed');
		// 	});
		// 	mediaSource.addEventListener('sourceended', () => {
		// 		console.log('MediaSource ended');
		// 	});
	}
</script>

<div class="relative sm:mx-5">
	<!-- <video bind:this={videoElement} id="video-player" controls class="bg-gray-700"></video> -->
	<video
		bind:this={videoElement}
		class="max-h-[25vh] w-full bg-blue-300 object-contain shadow-md"
		muted={isMuted}
	>
		Player stub
	</video>

	<!-- Top Left - Current Media Info -->
	<div class="absolute top-3 left-3">
		<div class="flex items-center gap-2 rounded bg-black/50 p-2 text-white backdrop-blur-sm">
			<div>
				<div class="text-xs text-gray-400">{selectedBlockNumber} / {blocks.length}</div>
			</div>
			<div>
				<div class="text-sm font-medium">{selectedBlock?.blockName}</div>
				<div class="text-xs text-gray-300">{selectedBlock?.currentAlternativeName}</div>
			</div>
		</div>
	</div>

	<!-- Top Right - Edit Button -->
	{#if showEditButton}
		<div
			class="absolute top-3 right-3 rounded-md bg-gradient-to-br from-orange-500 to-red-500 p-1 shadow-lg ring-2 ring-orange-400/50 ring-offset-2 ring-offset-black/20"
		>
			<a
				href="{projectId}/blocks/{selectedBlockId}"
				class="flex h-12 w-12 items-center justify-center rounded-md text-white transition-transform duration-200 hover:scale-105 hover:bg-white/20"
			>
				<Edit class="h-7 w-7" />
			</a>
		</div>
	{/if}

	<!-- Custom Media Controls -->
	<div class="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
		<div
			class="pointer-events-auto flex items-center gap-2 rounded-lg bg-black/50 p-3 backdrop-blur-sm"
		>
			<!-- Go to start -->
			<Button
				variant="ghost"
				size="icon"
				disabled={!canGoToStart}
				onclick={() => (selectedBlockId = blocks[0].id)}
				class="h-10 w-10 text-white hover:bg-white/20 disabled:opacity-50 disabled:hover:bg-transparent"
			>
				<SkipBack class="h-5 w-5" />
			</Button>

			<!-- Go back -->
			<Button
				variant="ghost"
				size="icon"
				disabled={!canGoBack}
				onclick={() => (selectedBlockId = blocks[selectedBlockIndex - 1].id)}
				class="h-10 w-10 text-white hover:bg-white/20 disabled:opacity-50 disabled:hover:bg-transparent"
			>
				<StepBack class="h-5 w-5" />
			</Button>

			<!-- Play/Pause -->
			<Button variant="ghost" size="icon" class="h-12 w-12 text-white hover:bg-white/20" disabled>
				{#if isPlaying}
					<Pause class="h-6 w-6" />
				{:else}
					<Play class="h-6 w-6" />
				{/if}
			</Button>

			<!-- Go forward -->
			<Button
				variant="ghost"
				size="icon"
				disabled={!canGoForward}
				onclick={() => (selectedBlockId = blocks[selectedBlockIndex + 1].id)}
				class="h-10 w-10 text-white hover:bg-white/20 disabled:opacity-50 disabled:hover:bg-transparent"
			>
				<StepForward class="h-5 w-5" />
			</Button>

			<!-- Go to end -->
			<Button
				variant="ghost"
				size="icon"
				disabled={!canGoToEnd}
				onclick={() => (selectedBlockId = blocks[blocks.length - 1].id)}
				class="h-10 w-10 text-white hover:bg-white/20 disabled:opacity-50 disabled:hover:bg-transparent"
			>
				<SkipForward class="h-5 w-5" />
			</Button>

			<!-- Mute toggle -->
			<!-- <Button variant="ghost" size="icon" class="h-10 w-10 text-white hover:bg-white/20">
				<VolumeX class="h-5 w-5" />
			</Button> -->
		</div>
	</div>
</div>
