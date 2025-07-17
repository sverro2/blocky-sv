<script lang="ts">
	import { onMount } from 'svelte';
	import { mediaPlaybackService } from '$lib/services/media-playback';
	import type { Block } from '$lib/client/idb';
	import type { ProjectStore } from '$lib/services/project-store';

	interface Props {
		blocks: Block[];
		selectedBlockId?: string | null;
		onBlockSelect?: (blockId: string) => void;
		onPlaybackStateChange?: (playbackState: unknown) => void;
		onBlockTransition?: (blockId: string, blockIndex: number) => void;
		projectStore: ProjectStore;
	}

	let {
		blocks,
		selectedBlockId,
		onBlockSelect,
		onPlaybackStateChange,
		onBlockTransition,
		projectStore
	}: Props = $props();

	let videoElement: HTMLVideoElement | null = $state(null);
	let playbackState = $state(mediaPlaybackService.state);
	let playbackError = $state<string | null>(null);
	let switchingRecording = $state<string | null>(null);
	let previewingRecording = $state<string | null>(null);

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

		// Add keyboard shortcuts
		function handleKeyPress(event: KeyboardEvent) {
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
				return; // Don't interfere with input fields
			}

			switch (event.key) {
				case ' ':
					event.preventDefault();
					togglePlayback();
					break;
				case 'p':
					event.preventDefault();
					togglePlayback();
					break;
				case 's':
					event.preventDefault();
					stopPlayback();
					break;
				case 'r':
					if (event.ctrlKey && blocks.length > 0) {
						event.preventDefault();
						playFromBlock(blocks[0].blockId);
					}
					break;
			}
		}

		document.addEventListener('keydown', handleKeyPress);

		return () => {
			clearInterval(interval);
			document.removeEventListener('keydown', handleKeyPress);
		};
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

	async function switchRecording(blockId: string, mediaId: string) {
		try {
			switchingRecording = mediaId;

			// Analytics tracking
			console.log('Analytics: Recording switched', {
				blockId,
				mediaId,
				timestamp: new Date().toISOString(),
				action: 'switch_recording'
			});

			await projectStore.switchBlockRecording(blockId, mediaId);

			// Show brief feedback
			setTimeout(() => {
				switchingRecording = null;
			}, 500);
		} catch (error) {
			console.error('Failed to switch recording:', error);
			switchingRecording = null;
		}
	}

	async function deleteRecording(blockId: string, mediaId: string, event: Event) {
		event.stopPropagation();

		if (!confirm('Are you sure you want to delete this recording? This cannot be undone.')) {
			return;
		}

		try {
			// Analytics tracking
			console.log('Analytics: Recording deleted', {
				blockId,
				mediaId,
				timestamp: new Date().toISOString(),
				action: 'delete_recording'
			});

			await projectStore.removeRecordingFromBlock(blockId, mediaId);
		} catch (error) {
			console.error('Failed to delete recording:', error);
			playbackError = error instanceof Error ? error.message : 'Failed to delete recording';
		}
	}

	async function previewRecording(blockId: string, mediaId: string, event: Event) {
		event.stopPropagation();

		try {
			previewingRecording = mediaId;

			// Analytics tracking
			console.log('Analytics: Recording previewed', {
				blockId,
				mediaId,
				timestamp: new Date().toISOString(),
				action: 'preview_recording'
			});

			// Temporarily switch to this recording for preview
			await projectStore.switchBlockRecording(blockId, mediaId);

			// Start playback from this block
			await startPlayback(blockId);

			// Stop preview after 3 seconds
			setTimeout(() => {
				mediaPlaybackService.pause();
				previewingRecording = null;
			}, 3000);
		} catch (error) {
			console.error('Failed to preview recording:', error);
			previewingRecording = null;
		}
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
					{#each Array(playbackState.totalBlocks) as _, index (index)}
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

	<!-- Block Controls -->
	{#if blocks.length > 0}
		<div class="space-y-4">
			{#each blocks as block (block.blockId)}
				<div class="rounded-lg border bg-white p-4 shadow-sm">
					<div class="mb-3 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium text-gray-700"
								>Block {blocks.indexOf(block) + 1}</span
							>
							{#if playbackState.currentBlockId === block.blockId}
								{#if playbackState.isPlaying}
									<div class="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5">
										<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></div>
										<span class="text-xs font-medium text-green-700">PLAYING</span>
									</div>
								{:else}
									<div class="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5">
										<div class="h-1.5 w-1.5 rounded-full bg-yellow-400"></div>
										<span class="text-xs font-medium text-yellow-700">CURRENT</span>
									</div>
								{/if}
							{/if}
						</div>
						<button
							onclick={() => playFromBlock(block.blockId)}
							class="rounded bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600"
							title="Play from this block"
						>
							▶️ Play
						</button>
					</div>

					<!-- Recording Selection -->
					{#if block.media.length > 1}
						<div class="mb-3">
							<label
								class="mb-2 block text-xs font-medium text-gray-600"
								for="recordings-{block.blockId}"
							>
								Available Recordings ({block.media.length})
							</label>
							<div class="space-y-2" id="recordings-{block.blockId}">
								{#each block.media as media, index (media.mediaId)}
									<div
										class="w-full rounded border p-3 text-left text-sm transition-all duration-200"
										class:border-blue-500={media.mediaId === block.currentMediaId}
										class:bg-blue-50={media.mediaId === block.currentMediaId}
										class:shadow-sm={media.mediaId === block.currentMediaId}
										class:border-gray-300={media.mediaId !== block.currentMediaId}
										class:hover:border-blue-400={media.mediaId !== block.currentMediaId}
										class:hover:bg-gray-50={media.mediaId !== block.currentMediaId}
										class:opacity-50={switchingRecording === media.mediaId}
									>
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<div class="flex items-center gap-2">
													<span class="font-medium text-gray-700">
														Recording {index + 1}
													</span>
													{#if media.mediaId === block.currentMediaId}
														<span class="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
															Active
														</span>
													{:else if switchingRecording === media.mediaId}
														<span class="rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-white">
															Switching...
														</span>
													{:else if previewingRecording === media.mediaId}
														<span class="rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
															Previewing...
														</span>
													{/if}
												</div>
												<div class="mt-1 font-mono text-xs text-gray-500">
													ID: {media.mediaId.slice(0, 12)}...
												</div>
											</div>
											<div class="flex items-center gap-2">
												{#if media.mediaId === block.currentMediaId}
													<span class="text-blue-500">✓</span>
												{:else}
													<button
														onclick={() => switchRecording(block.blockId, media.mediaId)}
														class="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
														title="Switch to this recording"
														disabled={switchingRecording === media.mediaId}
													>
														Use
													</button>
												{/if}
												{#if media.mediaId !== block.currentMediaId}
													<button
														onclick={(event) =>
															previewRecording(block.blockId, media.mediaId, event)}
														class="rounded p-1 text-green-500 hover:bg-green-50 hover:text-green-700"
														title="Preview this recording (3 seconds)"
														disabled={previewingRecording !== null}
													>
														👁️
													</button>
												{/if}
												{#if block.media.length > 1}
													<button
														onclick={(event) =>
															deleteRecording(block.blockId, media.mediaId, event)}
														class="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
														title="Delete this recording"
													>
														🗑️
													</button>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<div class="mb-3">
							<div class="rounded border border-gray-200 bg-gray-50 p-3">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-gray-700">Single Recording</span>
									<span class="rounded-full bg-gray-500 px-2 py-0.5 text-xs text-white">
										Active
									</span>
								</div>
								<div class="mt-1 font-mono text-xs text-gray-500">
									ID: {block.currentMediaId.slice(0, 12)}...
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Keyboard Shortcuts Help -->
		<div class="mt-4 rounded-lg bg-gray-100 p-3">
			<h3 class="mb-2 text-sm font-medium text-gray-700">Keyboard Shortcuts</h3>
			<div class="grid grid-cols-2 gap-2 text-xs text-gray-600">
				<div>
					<kbd class="rounded bg-white px-1 py-0.5">Space</kbd> or
					<kbd class="rounded bg-white px-1 py-0.5">P</kbd> - Play/Pause
				</div>
				<div><kbd class="rounded bg-white px-1 py-0.5">S</kbd> - Stop</div>
				<div><kbd class="rounded bg-white px-1 py-0.5">Ctrl+R</kbd> - Restart from beginning</div>
				<div>👁️ - Preview recording (3 seconds)</div>
				<div>🗑️ - Delete recording</div>
				<div>✓ - Active recording</div>
			</div>
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
