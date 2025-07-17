<script lang="ts">
	import { onMount } from 'svelte';
	import { createProjectStore } from '$lib/services/project-store';
	import RecordingControls from '$lib/components/project/RecordingControls.svelte';
	import MediaPlayer from '$lib/components/project/MediaPlayer.svelte';
	import BlockList from '$lib/components/project/BlockList.svelte';
	import StorageManager from '$lib/components/project/StorageManager.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import type { PageProps } from './$types';
	import type { CleanupSummary } from '$lib/services/media-cleanup';
	import { toast } from '$lib/utils/toast';

	let { data }: PageProps = $props();

	// Initialize project store
	const projectStore = createProjectStore(data.projectId);
	const { state: projectState, blocks, isLoaded } = projectStore;

	let selectedBlockId = $state<string | null>(null);
	let currentlyPlayingBlockId = $state<string | null>(null);
	let currentBlockIndex = $state<number>(0);
	let isLoadingProject = $state(true);
	let projectError = $state<string | null>(null);

	onMount(async () => {
		try {
			await projectStore.loadProject();
		} catch (error) {
			projectError = error instanceof Error ? error.message : 'Failed to load project';
		} finally {
			isLoadingProject = false;
		}
	});

	// Update currently playing block ID from media player
	$effect(() => {
		// This will be updated by the MediaPlayer component
		// We'll set up a callback to get the current playing state
	});

	// Handle recording completion
	function handleRecordingComplete(mediaId: string) {
		console.log('Recording completed:', mediaId);
		// The projectStore already handles adding the media
		// We could add additional logic here if needed
	}

	// Handle block selection
	function handleBlockSelect(blockId: string) {
		selectedBlockId = blockId;
	}

	// Handle block play request
	async function handleBlockPlay(blockId: string): Promise<void> {
		selectedBlockId = blockId;
		// The MediaPlayer component will automatically start playback
		// when selectedBlockId changes via the $effect

		// Add a small delay to allow the effect to trigger
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	// Handle playback state changes from MediaPlayer
	function handlePlaybackStateChange(playbackState: unknown) {
		if (playbackState && typeof playbackState === 'object' && 'currentBlockId' in playbackState) {
			currentlyPlayingBlockId = (playbackState as { currentBlockId: string | null }).currentBlockId;
		}
	}

	// Handle block transitions during playback
	function handleBlockTransition(blockId: string, blockIndex: number) {
		console.log(`Block transition: ${blockId} (index: ${blockIndex})`);
		currentlyPlayingBlockId = blockId;
		currentBlockIndex = blockIndex;
		// Automatically select the currently playing block
		selectedBlockId = blockId;

		// Show toast notification for block transition
		const totalBlocks = $blocks.length;
		const shortBlockId = blockId.slice(0, 8);
		toast.info(`Now playing block ${blockIndex + 1}/${totalBlocks} (${shortBlockId}...)`, {
			duration: 2000
		});
	}

	// Handle block reordering
	async function handleBlocksReorder(newBlocks: typeof $blocks) {
		try {
			await projectStore.reorderBlocks(newBlocks);
		} catch (error) {
			console.error('Failed to reorder blocks:', error);
		}
	}

	// Handle block deletion
	async function handleBlockDelete(blockId: string) {
		try {
			await projectStore.removeBlock(blockId);
			if (selectedBlockId === blockId) {
				selectedBlockId = null;
			}
		} catch (error) {
			console.error('Failed to delete block:', error);
		}
	}

	// Clear project errors
	function clearProjectError() {
		projectStore.clearError();
		projectError = null;
	}

	// Handle storage cleanup completion
	function handleCleanupComplete(summary: CleanupSummary) {
		console.log('Storage cleanup completed:', summary);
		if (summary.totalSuccessful > 0) {
			// Optionally refresh the project to reflect any changes
			projectStore.loadProject();
		}
	}
</script>

<svelte:head>
	<title>Project: {data.projectId}</title>
</svelte:head>

<div class="project-page min-h-screen bg-gray-50 p-6">
	<div class="mx-auto max-w-6xl">
		<!-- Header -->
		<header class="mb-8">
			<h1 class="mb-2 text-3xl font-bold text-gray-900">
				Project: {data.projectId}
			</h1>
			<p class="text-gray-600">Manage your audio recordings and create seamless playlists</p>
		</header>

		<!-- Loading State -->
		{#if isLoadingProject}
			<div class="loading-container">
				<div class="flex items-center justify-center py-12">
					<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
					<span class="ml-3 text-gray-600">Loading project...</span>
				</div>
			</div>
		{/if}

		<!-- Error State -->
		{#if projectError || $projectState.error}
			<div class="error-container mb-6">
				<div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium">Error Loading Project</h3>
							<p class="mt-1 text-sm">
								{projectError || $projectState.error}
							</p>
						</div>
						<div class="ml-auto">
							<button onclick={clearProjectError} class="text-sm underline hover:no-underline">
								Dismiss
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Main Content -->
		{#if !isLoadingProject && !projectError}
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<!-- Left Column: Controls and Block List -->
				<div class="space-y-6 lg:col-span-2">
					<!-- Recording Controls -->
					<section class="rounded-lg bg-white p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-semibold text-gray-900">Recording Controls</h2>
						<RecordingControls
							{projectStore}
							blocks={$blocks}
							onRecordingComplete={handleRecordingComplete}
						/>
					</section>

					<!-- Block List -->
					<section class="rounded-lg bg-white p-6 shadow-sm">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900">Audio Blocks</h2>
							<span class="text-sm text-gray-500">
								{$blocks.length} block{$blocks.length === 1 ? '' : 's'}
							</span>
						</div>
						<BlockList
							blocks={$blocks}
							{selectedBlockId}
							{currentlyPlayingBlockId}
							{currentBlockIndex}
							onBlockSelect={handleBlockSelect}
							onBlockPlay={handleBlockPlay}
							onBlocksReorder={handleBlocksReorder}
							onBlockDelete={handleBlockDelete}
						/>
					</section>
				</div>

				<!-- Right Column: Media Player & Storage -->
				<div class="space-y-6 lg:col-span-1">
					<section class="sticky top-6 rounded-lg bg-white p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-semibold text-gray-900">Media Player</h2>
						<MediaPlayer
							blocks={$blocks}
							{selectedBlockId}
							onBlockSelect={handleBlockPlay}
							onPlaybackStateChange={handlePlaybackStateChange}
							onBlockTransition={handleBlockTransition}
							{projectStore}
						/>
					</section>

					<section class="rounded-lg bg-white p-6 shadow-sm">
						<StorageManager projectId={data.projectId} onCleanupComplete={handleCleanupComplete} />
					</section>
				</div>
			</div>
		{/if}

		<!-- Debug Info (only in development) -->
		{#if import.meta.env.DEV}
			<details class="mt-8 rounded-lg bg-gray-100 p-4">
				<summary class="mb-2 cursor-pointer text-sm font-medium text-gray-700">
					Debug Information
				</summary>
				<pre class="overflow-auto text-xs text-gray-600">
					{JSON.stringify(
						{
							projectId: data.projectId,
							blocksCount: $blocks.length,
							selectedBlockId,
							isLoaded: $isLoaded,
							state: $projectState
						},
						null,
						2
					)}
				</pre>
			</details>
		{/if}
	</div>
</div>

<!-- Toast Notifications -->
<Toast />

<style>
	.project-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	}

	.loading-container,
	.error-container {
		animation: fadeIn 0.3s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Responsive adjustments */
	@media (max-width: 1024px) {
		.project-page {
			padding: 1rem;
		}
	}

	@media (max-width: 640px) {
		.project-page {
			padding: 0.5rem;
		}

		.max-w-6xl {
			max-width: 100%;
		}
	}
</style>
