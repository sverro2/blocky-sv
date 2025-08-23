<script lang="ts">
	import { sensors, dropAnimation } from '$lib';
	import {
		DndContext,
		DragOverlay,
		type DragEndEvent,
		type DragStartEvent
	} from '@dnd-kit-svelte/core';
	import { arrayMove, SortableContext } from '@dnd-kit-svelte/sortable';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { GripVertical } from 'lucide-svelte';
	import Droppable from './droppable.svelte';
	import SortableBlock from './sortable/sortable-block.svelte';
	import { crossfade } from 'svelte/transition';
	import type { BlockMovedDto } from '$lib/api/block-moved-dto';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		projectId: string;
		blocks: BlockListItem[];
		selectedBlockId?: string | null;
		onSelectItem?: (mediaId: string) => void;
		onDragStart?(event: DragStartEvent): void;
		onDragEnd?(event: DragEndEvent): void;
	}

	let { projectId, blocks, selectedBlockId, onSelectItem, onDragStart, onDragEnd }: Props =
		$props();

	let draggedId = $state<string | null>(null);
	const activeBlock = $derived(blocks.find((block) => block.id === draggedId));

	let scrollContainer: HTMLElement;
	let scrollY = $state(0);

	function updateScrollPosition() {
		if (scrollContainer) {
			scrollY = scrollContainer.scrollTop;
		}
	}

	function handleDragStart(event: DragStartEvent) {
		draggedId = event.active.id as string;
	}

	async function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over) return;

		const overBlock = $state.snapshot(blocks.find((block) => block.id === over?.id));
		if (!overBlock || draggedId === overBlock.id) return;

		const oldIndex = blocks.findIndex((block) => block.id === active.id);
		const newIndex = blocks.findIndex((block) => block.id === over.id);
		// blocks = arrayMove(blocks, oldIndex, newIndex);

		const blockMoved: BlockMovedDto = {
			blockId: active.id as string,
			newIndex
		};

		blocks = arrayMove(blocks, oldIndex, newIndex);

		const response = await fetch(`/api/projects/${projectId}/blocks/reorder`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(blockMoved)
		});

		invalidateAll();

		// If something went wrong when reordering, returns items to their old position.
		if (!response.ok) {
			blocks = arrayMove(blocks, newIndex, oldIndex);
		}

		// if (onDragEnd) {
		// 	onDragEnd(event);
		// }

		draggedId = null;
	}
	const [send, recieve] = crossfade({ duration: 200 });
</script>

<div class="space-y-6 px-5" bind:this={scrollContainer} onscroll={updateScrollPosition}>
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-semibold tracking-tight">Audio Blocks</h2>
			<p class="text-muted-foreground text-sm">Manage and organize your recordings</p>
		</div>
		<Badge variant="secondary">{blocks.length} blocks</Badge>
	</div>

	<DndContext {sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
		<div class="space-y-4">
			{@render taskList('blocks', 'Audio Blocks', blocks)}

			<DragOverlay {dropAnimation}>
				{#if activeBlock && draggedId}
					<div style="transform: translateY({scrollY}px);">
						<Card.Root class="shadow-lg">
							<Card.Content class="flex items-center gap-3">
								<GripVertical class="text-muted-foreground h-4 w-4" />
								<div class="flex-1">
									<p class="font-medium">{activeBlock.blockName}</p>
								</div>
							</Card.Content>
						</Card.Root>
					</div>
				{/if}
			</DragOverlay>
		</div>
	</DndContext>
</div>

{#snippet taskList(id: string, title: string, blocks: BlockListItem[])}
	<SortableContext items={blocks}>
		<Droppable {id}>
			{#if blocks.length === 0}
				<div class="flex h-32 items-center justify-center">
					<div class="text-center">
						<p class="text-muted-foreground text-sm">No audio blocks</p>
						<p class="text-muted-foreground text-xs">This should never happen. You are stuck :(</p>
					</div>
				</div>
			{:else}
				<div class="space-y-3">
					{#each blocks as block (block.id)}
						<div in:recieve={{ key: block.id }} out:send={{ key: block.id }}>
							<SortableBlock {block} {selectedBlockId} {onSelectItem} />
						</div>
					{/each}
				</div>
			{/if}
		</Droppable>
	</SortableContext>
{/snippet}
