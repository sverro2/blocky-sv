<script lang="ts">
	import { onMount } from 'svelte';
	import { mediaPlaybackService } from '$lib/services/media-playback';
	import type { Block } from '$lib/client/idb';

	interface Props {
		blocks: Block[];
		selectedBlockId?: string | null;
		onBlockSelect?: (blockId: string) => void;
		onPlaybackStateChange?: (playbackState: any) => void;
		onBlockTransition?: (blockId: string, blockIndex: number) => void;
	}

	let { blocks, selectedBlockId, onBlockSelect, onPlaybackStateChange, onBlockTransition }: Props =
		$props();

	let videoElement: HTMLVideoElement | null = $state(null);
	let playbackState = $state(mediaPlaybackService.state);
	let playbackError = $state<string | null>(null);

	onMount(() => {
		if (videoElement) {
			mediaPlaybackService.setVideoElement(videoElement);
		}

		// Set up block change callback
		mediaPlaybackService.setBlockChangeCallback((blockId: string, blockIndex: number) => {
			console.log(`Block transition: ${blockId} (${blockIndex})`);
			onBlockTransition?.(blockId, blockIndex);
		});

		// Subscribe to playback state changes
		const interval = setInterval(() => {
			const newPlaybackState = mediaPlaybackService.state;
			playbackState = newPlaybackState;
			onPlaybackStateChange?.(newPlaybackState);
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
		<div
			class="mb-4 rounded-lg border p-3 text-sm transition-all duration-300"
			class:border-green-500={playbackState.isPlaying}
			class:bg-green-900={playbackState.isPlaying}
			class:border-yellow-500={!playbackState.isPlaying}
			class:bg-yellow-900={!playbackState.isPlaying}
			class:shadow-lg={playbackState.isPlaying}
			class:shadow-green-200={playbackState.isPlaying}
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-gray-300">Now playing:</span>
					{#if playbackState.isPlaying}
						<div class="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5">
							<div class="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
							<span class="font-bold tracking-wide text-green-700">LIVE</span>
						</div>
					{:else}
						<div class="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5">
							<div class="h-2 w-2 rounded-full bg-yellow-400"></div>
							<span class="font-bold tracking-wide text-yellow-700">PAUSED</span>
						</div>
					{/if}
				</div>
				{#if playbackState.isPlaying}
					<div class="flex items-center gap-1">
						<div class="h-1 w-1 animate-pulse rounded-full bg-green-400"></div>
						<div
							class="h-1 w-1 animate-pulse rounded-full bg-green-400"
							style="animation-delay: 0.1s"
						></div>
						<div
							class="h-1 w-1 animate-pulse rounded-full bg-green-400"
							style="animation-delay: 0.2s"
						></div>
					</div>
				{/if}
			</div>
			<div class="mt-2 flex items-center gap-2">
				<span class="text-xs text-gray-400">Block ID:</span>
				<span
					class="rounded border px-2 py-1 font-mono text-xs text-white"
					class:border-green-400={playbackState.isPlaying}
					class:bg-green-800={playbackState.isPlaying}
					class:border-yellow-400={!playbackState.isPlaying}
					class:bg-yellow-800={!playbackState.isPlaying}
				>
					{playbackState.currentBlockId}
				</span>
			</div>
			<div class="mt-2 flex items-center gap-2">
				<span class="text-xs text-gray-400">Progress:</span>
				<span class="text-xs text-gray-300">
					{playbackState.currentBlockIndex + 1} / {playbackState.totalBlocks} blocks
				</span>
			</div>

			<!-- Block Progress Indicator -->
			{#if playbackState.totalBlocks > 1}
				<div class="mt-2 flex items-center gap-1">
					{#each Array(playbackState.totalBlocks) as block, index (block)}
						<div
							class="h-2 flex-1 rounded-full transition-all duration-300"
							class:bg-green-500={index < playbackState.currentBlockIndex}
							class:bg-green-400={index === playbackState.currentBlockIndex &&
								playbackState.isPlaying}
							class:bg-yellow-400={index === playbackState.currentBlockIndex &&
								!playbackState.isPlaying}
							class:bg-gray-600={index > playbackState.currentBlockIndex}
							class:animate-pulse={index === playbackState.currentBlockIndex &&
								playbackState.isPlaying}
							title={`Block ${index + 1}${index === playbackState.currentBlockIndex ? ' (current)' : index < playbackState.currentBlockIndex ? ' (completed)' : ' (upcoming)'}`}
						></div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Quick Play Buttons -->
	{#if blocks.length > 0}
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
			{#each blocks as block (block)}
				<button
					onclick={() => playFromBlock(block.blockId)}
					class="relative rounded px-3 py-2 text-sm text-white transition-colors"
					class:bg-green-600={playbackState.currentBlockId === block.blockId}
					class:hover:bg-green-500={playbackState.currentBlockId === block.blockId}
					class:bg-blue-600={selectedBlockId === block.blockId &&
						playbackState.currentBlockId !== block.blockId}
					class:hover:bg-blue-500={selectedBlockId === block.blockId &&
						playbackState.currentBlockId !== block.blockId}
					class:bg-gray-600={playbackState.currentBlockId !== block.blockId &&
						selectedBlockId !== block.blockId}
					class:hover:bg-gray-500={playbackState.currentBlockId !== block.blockId &&
						selectedBlockId !== block.blockId}
					class:ring-2={playbackState.currentBlockId === block.blockId && playbackState.isPlaying}
					class:ring-green-400={playbackState.currentBlockId === block.blockId &&
						playbackState.isPlaying}
					title={playbackState.currentBlockId === block.blockId
						? playbackState.isPlaying
							? 'Currently playing'
							: 'Current block (paused)'
						: 'Play from this block'}
				>
					<div class="flex items-center gap-1">
						{#if playbackState.currentBlockId === block.blockId}
							{#if playbackState.isPlaying}
								<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></div>
							{:else}
								<div class="h-1.5 w-1.5 rounded-full bg-yellow-400"></div>
							{/if}
						{/if}
						<div class="truncate">
							{block.currentMediaId.slice(0, 8)}...
						</div>
					</div>
					{#if playbackState.currentBlockId === block.blockId && playbackState.isPlaying}
						<div
							class="playing-indicator absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full bg-green-400"
						></div>
					{/if}
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

<style>
	/* Playing indicator animation */
	@keyframes playingIndicator {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.7;
		}
	}

	:global(.playing-indicator) {
		animation: playingIndicator 1.5s ease-in-out infinite;
	}
</style>
