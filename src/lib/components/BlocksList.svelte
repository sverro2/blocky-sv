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
	const [send, recieve] = crossfade({ duration: 100 });
</script>

<DndContext {sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
	<div class="text-black">
		<div class="grid gap-4 text-black md:grid-cols-2">
			{@render taskList('in-progress', 'In Progress', blocks)}
		</div>

		<DragOverlay {dropAnimation}>
			{#if activeBlock && activeId}
				<SortableItem block={activeBlock} />
			{/if}
		</DragOverlay>
	</div>
</DndContext>

{#snippet taskList(id: string, title: string, blocks: Block[])}
	<SortableContext items={blocks}>
		<Droppable class="p-3 pt-6" {id}>
			<div class="grid gap-2">
				{#each blocks as block (block.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						onclick={() => selectItem(block.currentMediaId)}
						class=""
						in:recieve={{ key: block.id }}
						out:send={{ key: block.id }}
					>
						<SortableItem {block} />
					</div>
				{/each}
			</div>
		</Droppable>
	</SortableContext>
{/snippet}
