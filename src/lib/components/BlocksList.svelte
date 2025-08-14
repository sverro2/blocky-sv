<script lang="ts">
	import { sensors, dropAnimation } from '$lib';
	import type { Block } from '$lib/client/idb';
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
	import SortableItem from './sortable/sortable-item.svelte';
	import { crossfade } from 'svelte/transition';

	interface Props {
		blocks: Block[];
		selectedMediaId?: string | null;
		onSelectItem?: (mediaId: string) => void;
		onDragStart?(event: DragEndEvent): void;
		onDragEnd?(event: DragEndEvent): void;
	}

	let { blocks, selectedMediaId, onSelectItem, onDragStart, onDragEnd }: Props = $props();

	function selectItem(mediaId: string) {
		if (onSelectItem) {
			onSelectItem(mediaId);
		}
	}

	let activeId = $state<string | null>(null);
	const activeBlock = $derived(blocks.find((block) => block.id === activeId));

	let scrollContainer: HTMLElement;
	let scrollY = $state(0);

	function updateScrollPosition() {
		if (scrollContainer) {
			scrollY = scrollContainer.scrollTop;
		}
	}

	function handleDragStart(event: DragStartEvent) {
		activeId = event.active.id as string;
	}

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over) return;

		const overBlock = $state.snapshot(blocks.find((block) => block.id === over?.id));
		if (!overBlock || activeId === overBlock.id) return;

		const oldIndex = blocks.findIndex((block) => block.id === active.id);
		const newIndex = blocks.findIndex((block) => block.id === over.id);
		blocks = arrayMove(blocks, oldIndex, newIndex);

		activeId = null;
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
				{#if activeBlock && activeId}
					<div style="transform: translateY({scrollY}px);">
						<Card.Root class="shadow-lg">
							<Card.Content class="flex items-center gap-3">
								<GripVertical class="text-muted-foreground h-4 w-4" />
								<div class="flex-1">
									<p class="font-medium">Block {activeBlock.id}</p>
								</div>
							</Card.Content>
						</Card.Root>
					</div>
				{/if}
			</DragOverlay>
		</div>
	</DndContext>
</div>

{#snippet taskList(id: string, title: string, blocks: Block[])}
	<SortableContext items={blocks}>
		<Droppable {id}>
			{#if blocks.length === 0}
				<div class="flex h-32 items-center justify-center">
					<div class="text-center">
						<p class="text-muted-foreground text-sm">No audio blocks yet</p>
						<p class="text-muted-foreground text-xs">Start recording to create your first block</p>
					</div>
				</div>
			{:else}
				<div class="space-y-3">
					{#each blocks as block (block.id)}
						<div in:recieve={{ key: block.id }} out:send={{ key: block.id }}>
							<SortableItem {block} {selectedMediaId} {onSelectItem} />
						</div>
					{/each}
				</div>
			{/if}
		</Droppable>
	</SortableContext>
{/snippet}
