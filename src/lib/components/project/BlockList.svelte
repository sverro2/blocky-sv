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
		onBlocksReorder?: (newBlocks: Block[]) => void;
		onBlockDelete?: (blockId: string) => void;
	}

	let { blocks, selectedBlockId, onBlockSelect, onBlocksReorder, onBlockDelete }: Props = $props();

	let sortableElement: HTMLElement | null = $state(null);

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

<div class="block-list">
	{#if blocks.length === 0}
		<div class="empty-state">
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
					class="block-item"
					class:selected={selectedBlockId === block.blockId}
					title="Click to select, drag to reorder"
				>
					<div class="block-content">
						<!-- Media Info -->
						<div class="media-info">
							<div class="media-id">
								{formatMediaId(block.currentMediaId)}
							</div>
							<div class="media-count">
								{block.media.length} media file{block.media.length === 1 ? '' : 's'}
							</div>
						</div>

						<!-- Play Button -->
						<button
							onclick={(e) => {
								e.stopPropagation();
								handleBlockSelect(block.blockId);
							}}
							class="play-button"
							title="Play from this block"
						>
							<PlayIcon size={16} />
						</button>

						<!-- Drag Handle -->
						<div class="drag-handle" title="Drag to reorder">
							<div class="drag-dots">
								<div class="dot"></div>
								<div class="dot"></div>
								<div class="dot"></div>
								<div class="dot"></div>
								<div class="dot"></div>
								<div class="dot"></div>
							</div>
						</div>

						<!-- Delete Button -->
						<button
							onclick={(e) => handleBlockDelete(block.blockId, e)}
							class="delete-button"
							title="Delete this block"
						>
							×
						</button>
					</div>

					<!-- Block Details (expandable) -->
					{#if selectedBlockId === block.blockId}
						<div class="block-details">
							<div class="detail-row">
								<span class="detail-label">Block ID:</span>
								<span class="detail-value font-mono text-xs">{block.blockId}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Current Media:</span>
								<span class="detail-value font-mono text-xs">{block.currentMediaId}</span>
							</div>
							{#if block.media.length > 1}
								<div class="detail-row">
									<span class="detail-label">All Media:</span>
									<div class="media-list">
										{#each block.media as media (media)}
											<span class="media-tag">{formatMediaId(media.mediaId)}</span>
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
	.block-list {
		width: 100%;
		max-width: 600px;
	}

	.empty-state {
		border: 2px dashed #d1d5db;
		border-radius: 8px;
		background-color: #f9fafb;
	}

	.block-item {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background-color: white;
		transition: all 0.2s ease;
		cursor: pointer;
		overflow: hidden;
	}

	.block-item:hover {
		border-color: #3b82f6;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
	}

	.block-item.selected {
		border-color: #3b82f6;
		background-color: #eff6ff;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.block-content {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		gap: 12px;
	}

	.media-info {
		flex: 1;
		min-width: 0;
	}

	.media-id {
		font-family: 'Courier New', monospace;
		font-size: 14px;
		font-weight: 600;
		color: #374151;
		margin-bottom: 2px;
	}

	.media-count {
		font-size: 12px;
		color: #6b7280;
	}

	.play-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background-color: #3b82f6;
		color: white;
		border: none;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.play-button:hover {
		background-color: #2563eb;
	}

	.drag-handle {
		cursor: grab;
		padding: 4px;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}

	.drag-handle:hover {
		background-color: #f3f4f6;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.drag-dots {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2px;
		width: 12px;
		height: 12px;
	}

	.dot {
		width: 3px;
		height: 3px;
		background-color: #9ca3af;
		border-radius: 50%;
	}

	.delete-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background-color: #ef4444;
		color: white;
		border: none;
		cursor: pointer;
		font-size: 16px;
		line-height: 1;
		transition: background-color 0.2s ease;
	}

	.delete-button:hover {
		background-color: #dc2626;
	}

	.block-details {
		border-top: 1px solid #e5e7eb;
		padding: 12px 16px;
		background-color: #f9fafb;
	}

	.detail-row {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		margin-bottom: 8px;
	}

	.detail-row:last-child {
		margin-bottom: 0;
	}

	.detail-label {
		font-size: 12px;
		font-weight: 600;
		color: #6b7280;
		min-width: 80px;
	}

	.detail-value {
		font-size: 12px;
		color: #374151;
		word-break: break-all;
	}

	.media-list {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.media-tag {
		background-color: #e5e7eb;
		color: #374151;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 10px;
		font-family: 'Courier New', monospace;
	}

	/* Dragging styles */
	:global(.dragged-item) {
		opacity: 0.5;
		transform: rotate(5deg);
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.block-content {
			padding: 8px 12px;
			gap: 8px;
		}

		.media-id {
			font-size: 12px;
		}

		.media-count {
			font-size: 10px;
		}

		.play-button {
			width: 28px;
			height: 28px;
		}
	}
</style>
