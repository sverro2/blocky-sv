<script lang="ts">
	import { PlayIcon } from 'lucide-svelte';
	import { useSortable } from '$lib/client/use-sortable.svelte';
	import { blockManager } from '$lib/services/block-manager';
	import type { Block } from '$lib/client/idb';
	import type Sortable from 'sortablejs';

	interface Props {
		blocks: Block[];
		selectedBlockId?: string | null;
		currentlyPlayingBlockId?: string | null;
		currentBlockIndex?: number;
		onBlockSelect?: (blockId: string) => void;
		onBlockPlay?: (blockId: string) => Promise<void>;
		onBlocksReorder?: (newBlocks: Block[]) => void;
		onBlockDelete?: (blockId: string) => void;
	}

	let {
		blocks,
		selectedBlockId,
		currentlyPlayingBlockId,
		currentBlockIndex,
		onBlockSelect,
		onBlockPlay,
		onBlocksReorder,
		onBlockDelete
	}: Props = $props();

	let sortableElement: HTMLElement | null = $state(null);
	let playingBlockId = $state<string | null>(null);

	// Initialize sortable functionality
	useSortable(() => sortableElement, {
		animation: 200,
		ghostClass: 'dragged-item',
		delayOnTouchOnly: true,
		delay: 200,
		onEnd(evt) {
			console.log('Reordering blocks...');
			if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
				const reorderedBlocks = blockManager.handleReorder(blocks, evt);
				onBlocksReorder?.(reorderedBlocks);
			}
		}
	});

	function handleBlockSelect(blockId: string) {
		onBlockSelect?.(blockId);
	}

	async function handleBlockPlay(blockId: string) {
		playingBlockId = blockId;
		try {
			await onBlockPlay?.(blockId);
		} finally {
			// Reset playing state after a brief delay
			setTimeout(() => {
				playingBlockId = null;
			}, 500);
		}
	}

	function handleBlockDelete(blockId: string, event: Event) {
		event.stopPropagation();
		if (
			confirm(
				'Are you sure you want to delete this block? This will also remove any unused media files.'
			)
		) {
			onBlockDelete?.(blockId);
		}
	}

	function formatMediaId(mediaId: string): string {
		return mediaId.length > 12 ? `${mediaId.slice(0, 8)}...${mediaId.slice(-4)}` : mediaId;
	}

	function getBlockStatus(blockIndex: number): 'completed' | 'playing' | 'upcoming' {
		if (currentBlockIndex === undefined) return 'upcoming';
		if (blockIndex < currentBlockIndex) return 'completed';
		if (blockIndex === currentBlockIndex && currentlyPlayingBlockId) return 'playing';
		return 'upcoming';
	}
</script>

<div class="block-list w-full max-w-[600px]">
	{#if blocks.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
			<div class="py-8 text-center text-gray-500">
				<div class="mb-4 text-4xl">🎵</div>
				<p class="mb-2 text-lg">No blocks yet</p>
				<p class="text-sm">Record some audio to get started!</p>
			</div>
		</div>
	{:else}
		<ul class="flex list-none flex-col gap-2 select-none" bind:this={sortableElement}>
			{#each blocks as block, blockIndex (block)}
				{@const blockStatus = getBlockStatus(blockIndex)}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<li
					onclick={() => handleBlockSelect(block.blockId)}
					class="relative cursor-pointer overflow-hidden rounded-lg border border-gray-300 bg-white transition-all duration-200 hover:border-blue-500 hover:shadow-lg"
					class:border-blue-500={selectedBlockId === block.blockId && blockStatus !== 'playing'}
					class:bg-blue-50={selectedBlockId === block.blockId && blockStatus !== 'playing'}
					class:shadow-md={selectedBlockId === block.blockId && blockStatus !== 'playing'}
					class:shadow-blue-200={selectedBlockId === block.blockId && blockStatus !== 'playing'}
					class:border-green-500={blockStatus === 'playing'}
					class:bg-green-50={blockStatus === 'playing'}
					class:shadow-lg={blockStatus === 'playing'}
					class:shadow-green-200={blockStatus === 'playing'}
					class:ring-2={blockStatus === 'playing'}
					class:ring-green-500={blockStatus === 'playing'}
					class:playing-block={blockStatus === 'playing'}
					class:border-green-300={blockStatus === 'completed'}
					class:bg-green-25={blockStatus === 'completed'}
					class:opacity-75={blockStatus === 'completed'}
					title="Click to select, drag to reorder"
				>
					{#if blockStatus === 'playing'}
						<div
							class="absolute -top-1 -right-1 z-10 h-3 w-3 animate-pulse rounded-full bg-green-500"
						></div>
						<div
							class="pointer-events-none absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent"
						></div>
					{:else if blockStatus === 'completed'}
						<div class="absolute -top-1 -right-1 z-10 h-3 w-3 rounded-full bg-green-600">
							<div class="absolute inset-0 flex items-center justify-center">
								<svg class="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						</div>
					{/if}
					<div class="flex items-center gap-3 p-3">
						<!-- Media Info -->
						<div class="min-w-0 flex-1">
							<div
								class="mb-0.5 flex items-center gap-2 font-mono text-sm font-semibold text-gray-700"
							>
								{#if currentlyPlayingBlockId === block.blockId}
									<div
										class="flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2 py-0.5"
									>
										<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
										<span class="text-xs font-bold tracking-wide text-green-700">NOW PLAYING</span>
									</div>
								{/if}
								<span
									class={blockStatus === 'playing'
										? 'font-bold text-green-700'
										: blockStatus === 'completed'
											? 'font-semibold text-green-600'
											: 'text-gray-700'}
								>
									{formatMediaId(block.currentMediaId)}
								</span>
							</div>
							<div
								class={blockStatus === 'playing'
									? 'text-xs text-green-600'
									: blockStatus === 'completed'
										? 'text-xs text-green-500'
										: 'text-xs text-gray-500'}
							>
								{block.media.length} media file{block.media.length === 1 ? '' : 's'}
								{#if blockStatus === 'playing'}
									<span class="ml-1 font-semibold">• ACTIVE</span>
								{:else if blockStatus === 'completed'}
									<span class="ml-1 font-semibold">• DONE</span>
								{/if}
							</div>
						</div>

						<!-- Play Button -->
						<button
							onclick={(e) => {
								e.stopPropagation();
								handleBlockPlay(block.blockId);
							}}
							class="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors"
							class:bg-green-500={blockStatus === 'playing'}
							class:hover:bg-green-600={blockStatus === 'playing'}
							class:bg-green-600={blockStatus === 'completed'}
							class:hover:bg-green-700={blockStatus === 'completed'}
							class:bg-blue-500={blockStatus === 'upcoming'}
							class:hover:bg-blue-600={blockStatus === 'upcoming'}
							class:opacity-50={playingBlockId === block.blockId}
							disabled={playingBlockId === block.blockId}
							title={blockStatus === 'playing'
								? 'Currently playing'
								: blockStatus === 'completed'
									? 'Completed - click to replay from here'
									: 'Play from this block'}
						>
							{#if playingBlockId === block.blockId}
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
								></div>
							{:else if blockStatus === 'playing'}
								<div class="h-4 w-4 animate-pulse rounded-full bg-white"></div>
							{:else if blockStatus === 'completed'}
								<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							{:else}
								<PlayIcon size={16} />
							{/if}
						</button>

						<!-- Drag Handle -->
						<div
							class="cursor-grab rounded p-1 transition-colors hover:bg-gray-100 active:cursor-grabbing"
							title="Drag to reorder"
						>
							<div class="grid h-3 w-3 grid-cols-2 gap-0.5">
								<div class="h-0.5 w-0.5 rounded-full bg-gray-400"></div>
								<div class="h-0.5 w-0.5 rounded-full bg-gray-400"></div>
								<div class="h-0.5 w-0.5 rounded-full bg-gray-400"></div>
								<div class="h-0.5 w-0.5 rounded-full bg-gray-400"></div>
								<div class="h-0.5 w-0.5 rounded-full bg-gray-400"></div>
								<div class="h-0.5 w-0.5 rounded-full bg-gray-400"></div>
							</div>
						</div>

						<!-- Delete Button -->
						<button
							onclick={(e) => handleBlockDelete(block.blockId, e)}
							class="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-base leading-none text-white transition-colors hover:bg-red-600"
							title="Delete this block"
						>
							×
						</button>
					</div>

					<!-- Block Details (expandable) -->
					{#if selectedBlockId === block.blockId || blockStatus === 'playing'}
						<div
							class="border-t p-3"
							class:border-green-200={currentlyPlayingBlockId === block.blockId}
							class:bg-green-50={currentlyPlayingBlockId === block.blockId}
							class:border-gray-200={currentlyPlayingBlockId !== block.blockId}
							class:bg-gray-50={currentlyPlayingBlockId !== block.blockId}
						>
							<div class="mb-2 flex items-start gap-2">
								<span class="min-w-20 text-xs font-semibold text-gray-600">Block ID:</span>
								<span class="font-mono text-xs break-all text-gray-700">{block.blockId}</span>
							</div>
							<div class="mb-2 flex items-start gap-2">
								<span class="min-w-20 text-xs font-semibold text-gray-600">Current Media:</span>
								<span class="font-mono text-xs break-all text-gray-700">{block.currentMediaId}</span
								>
							</div>
							{#if block.media.length > 1}
								<div class="flex items-start gap-2">
									<span class="min-w-20 text-xs font-semibold text-gray-600">All Media:</span>
									<div class="flex flex-wrap gap-1">
										{#each block.media as media (media.mediaId)}
											<span
												class="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-700"
												>{formatMediaId(media.mediaId)}</span
											>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	/* Dragging styles */
	:global(.dragged-item) {
		opacity: 0.5;
		transform: rotate(5deg);
	}

	/* Playing block animation */
	@keyframes playingPulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
		}
		50% {
			box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
		}
	}

	/* Apply animation to playing blocks */
	:global(.playing-block) {
		animation: playingPulse 2s ease-in-out infinite;
	}
</style>
