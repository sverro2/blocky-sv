<script lang="ts">
	import { PlayIcon } from 'lucide-svelte';
	import { useSortable } from '$lib/client/use-sortable.svelte';
	import { blockManager } from '$lib/services/block-manager';
	import type { Block } from '$lib/client/idb';
	import type Sortable from 'sortablejs';

	interface Props {
		blocks: Block[];
		selectedBlockId?: string | null;
		onBlockSelect?: (blockId: string) => void;
		onBlockPlay?: (blockId: string) => Promise<void>;
		onBlocksReorder?: (newBlocks: Block[]) => void;
		onBlockDelete?: (blockId: string) => void;
	}

	let {
		blocks,
		selectedBlockId,
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
		if (confirm('Are you sure you want to delete this block?')) {
			onBlockDelete?.(blockId);
		}
	}

	function formatMediaId(mediaId: string): string {
		return mediaId.length > 12 ? `${mediaId.slice(0, 8)}...${mediaId.slice(-4)}` : mediaId;
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
			{#each blocks as block (block)}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<li
					onclick={() => handleBlockSelect(block.blockId)}
					class="cursor-pointer overflow-hidden rounded-lg border border-gray-300 bg-white transition-all duration-200 hover:border-blue-500 hover:shadow-lg"
					class:border-blue-500={selectedBlockId === block.blockId}
					class:bg-blue-50={selectedBlockId === block.blockId}
					class:shadow-md={selectedBlockId === block.blockId}
					class:shadow-blue-200={selectedBlockId === block.blockId}
					title="Click to select, drag to reorder"
				>
					<div class="flex items-center gap-3 p-3">
						<!-- Media Info -->
						<div class="min-w-0 flex-1">
							<div class="mb-0.5 font-mono text-sm font-semibold text-gray-700">
								{formatMediaId(block.currentMediaId)}
							</div>
							<div class="text-xs text-gray-500">
								{block.media.length} media file{block.media.length === 1 ? '' : 's'}
							</div>
						</div>

						<!-- Play Button -->
						<button
							onclick={(e) => {
								e.stopPropagation();
								handleBlockPlay(block.blockId);
							}}
							class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white transition-colors hover:bg-blue-600"
							class:opacity-50={playingBlockId === block.blockId}
							disabled={playingBlockId === block.blockId}
							title="Play from this block"
						>
							{#if playingBlockId === block.blockId}
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
								></div>
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
					{#if selectedBlockId === block.blockId}
						<div class="border-t border-gray-200 bg-gray-50 p-3">
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
</style>
