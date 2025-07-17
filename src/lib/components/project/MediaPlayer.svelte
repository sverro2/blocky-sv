<script lang="ts">
	import { onMount } from 'svelte';
	import { mediaPlaybackService } from '$lib/services/media-playback';
	import type { Block } from '$lib/client/idb';

	interface Props {
		blocks: Block[];
		selectedBlockId?: string | null;
		onBlockSelect?: (blockId: string) => void;
	}

	let { blocks, selectedBlockId, onBlockSelect }: Props = $props();

	let videoElement: HTMLVideoElement | null = $state(null);
	let playbackState = $state(mediaPlaybackService.state);
	let playbackError = $state<string | null>(null);

	onMount(() => {
		if (videoElement) {
			mediaPlaybackService.setVideoElement(videoElement);
		}

		// Subscribe to playback state changes
		const interval = setInterval(() => {
			playbackState = mediaPlaybackService.state;
		}, 100);

		return () => clearInterval(interval);
	});

	// Auto-play when selectedBlockId changes
	let lastPlayedBlockId = $state<string | null>(null);

	$effect(() => {
		if (selectedBlockId && blocks.length > 0 && selectedBlockId !== lastPlayedBlockId) {
			startPlayback(selectedBlockId);
		}
	});

	async function startPlayback(blockId: string) {
		try {
			playbackError = null;
			await mediaPlaybackService.playFromBlock(blockId, blocks);
			lastPlayedBlockId = blockId;
		} catch (error) {
			playbackError = error instanceof Error ? error.message : 'Failed to play media';
			console.error('Playback error:', error);
		}
	}

	async function playFromBlock(blockId: string) {
		try {
			playbackError = null;
			await mediaPlaybackService.playFromBlock(blockId, blocks);
			onBlockSelect?.(blockId);
			lastPlayedBlockId = blockId;
		} catch (error) {
			playbackError = error instanceof Error ? error.message : 'Failed to play media';
			console.error('Playback error:', error);
		}
	}

	function togglePlayback() {
		if (playbackState.isPlaying) {
			mediaPlaybackService.pause();
		} else {
			mediaPlaybackService.play();
		}
	}

	function stopPlayback() {
		mediaPlaybackService.stop();
	}

	function formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}
</script>

<div class="media-player mb-4 min-h-[200px] rounded-lg bg-gray-800 p-4">
	<!-- Video Element -->
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		bind:this={videoElement}
		id="video-player"
		controls
		class="mb-4 w-full rounded bg-gray-700"
		style="max-height: 200px;"
	>
		Your browser does not support the video tag.
	</video>

	<!-- Playback Controls -->
	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<button
				onclick={togglePlayback}
				disabled={!playbackState.currentBlockId}
				class="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:bg-gray-500"
				title={playbackState.isPlaying ? 'Pause' : 'Play'}
			>
				{#if playbackState.isPlaying}
					⏸️ Pause
				{:else}
					▶️ Play
				{/if}
			</button>

			<button
				onclick={stopPlayback}
				disabled={!playbackState.currentBlockId}
				class="rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 disabled:bg-gray-500"
				title="Stop"
			>
				⏹️ Stop
			</button>
		</div>

		<!-- Time Display -->
		<div class="text-sm text-white">
			{formatTime(playbackState.currentPosition)} / {formatTime(playbackState.totalDuration)}
		</div>
	</div>

	<!-- Progress Bar -->
	<div class="mb-4 h-2 w-full rounded-full bg-gray-600">
		<div
			class="h-2 rounded-full bg-blue-500 transition-all duration-100"
			style="width: {playbackState.totalDuration > 0
				? (playbackState.currentPosition / playbackState.totalDuration) * 100
				: 0}%"
		></div>
	</div>

	<!-- Current Block Info -->
	{#if playbackState.currentBlockId}
		<div class="mb-2 text-sm text-white">
			<div class="flex items-center gap-2">
				<span class="text-gray-400">Now playing:</span>
				{#if playbackState.isPlaying}
					<div class="flex items-center gap-1">
						<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
						<span class="text-green-400">Live</span>
					</div>
				{:else}
					<div class="flex items-center gap-1">
						<div class="h-2 w-2 rounded-full bg-gray-500"></div>
						<span class="text-gray-400">Paused</span>
					</div>
				{/if}
			</div>
			<div class="mt-1 font-mono text-xs text-gray-300">
				Block: {playbackState.currentBlockId}
			</div>
		</div>
	{/if}

	<!-- Quick Play Buttons -->
	{#if blocks.length > 0}
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
			{#each blocks as block (block)}
				<button
					onclick={() => playFromBlock(block.blockId)}
					class="rounded bg-gray-600 px-3 py-2 text-sm text-white transition-colors hover:bg-gray-500"
					class:bg-blue-600={selectedBlockId === block.blockId}
					class:hover:bg-blue-500={selectedBlockId === block.blockId}
					class:ring-2={playbackState.currentBlockId === block.blockId && playbackState.isPlaying}
					class:ring-green-500={playbackState.currentBlockId === block.blockId &&
						playbackState.isPlaying}
					title="Play from this block"
				>
					<div class="flex items-center gap-1">
						{#if playbackState.currentBlockId === block.blockId && playbackState.isPlaying}
							<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></div>
						{/if}
						<div class="truncate">
							{block.currentMediaId.slice(0, 8)}...
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Error Display -->
	{#if playbackError}
		<div class="mt-4 rounded-md border border-red-400 bg-red-100 px-4 py-3 text-red-700">
			<p class="text-sm">
				<strong>Playback Error:</strong>
				{playbackError}
			</p>
			<button
				onclick={() => (playbackError = null)}
				class="mt-2 text-sm underline hover:no-underline"
			>
				Dismiss
			</button>
		</div>
	{/if}
</div>
