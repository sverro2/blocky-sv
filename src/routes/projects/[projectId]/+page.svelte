<script lang="ts">
	import type { Snapshot, Block } from '$lib/client/idb';

	import type { PageProps } from './$types';
	import { onMount } from 'svelte';

	import MediaRecorder from '$lib/components/MediaRecorder.svelte';
	import MediaPlayer from '$lib/components/MediaPlayer.svelte';
	import BlocksList from '$lib/components/BlocksList.svelte';
	import Droppable from '$lib/components/droppable.svelte';
	import SortableItem from '$lib/components/sortable/sortable-item.svelte';
	import {
		DndContext,
		DragOverlay,
		type DragEndEvent,
		type DragStartEvent
	} from '@dnd-kit-svelte/core';
	import { SortableContext, arrayMove } from '@dnd-kit-svelte/sortable';
	import { dropAnimation, sensors } from '$lib';
	import { crossfade } from 'svelte/transition';

	let { data }: PageProps = $props();

	let currentSnapshot = $state<Snapshot | undefined>(undefined);

	let currentSnapshotBlocks = $derived(
		currentSnapshot === undefined ? [] : currentSnapshot?.data.blocks
	);

	let mediaPlayer = $state<MediaPlayer | null>(null);

	onMount(async () => {
		await refreshItems();
	});

	async function refreshItems() {
		// let media = await getCurrentSnapshot(data.projectId);
		currentSnapshot = {
			version: 1,
			snapshotId: 'asdf',
			projectId: 'moeka',
			data: {
				blocks: [
					{
						currentMediaId: 'ab',
						id: 'bc',
						media: [{ mediaId: 'masdfsd' }, { mediaId: 'asdf' }]
					},
					{
						currentMediaId: 'ef',
						id: 'efg',
						media: [{ mediaId: 'masdfsd' }, { mediaId: 'asdf' }]
					}
				]
			}
		};
	}

	let selectedMediaId = $state<string | null>(null);

	function handleSelectItem(id: string) {
		selectedMediaId = id;
		if (mediaPlayer) {
			mediaPlayer.playMedia();
		}
	}

	function handleRecordingComplete() {
		refreshItems();
	}

	let activeId = $state<string | null>(null);

	const activeBlock = $derived(currentSnapshotBlocks.find((block) => block.id === activeId));

	function handleDragStart(event: DragStartEvent) {
		activeId = event.active.id as string;
	}

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over) return;

		const overBlock = $state.snapshot(currentSnapshotBlocks.find((block) => block.id === over?.id));
		if (!overBlock || activeId === overBlock.id) return;

		const oldIndex = currentSnapshotBlocks.findIndex((block) => block.id === active.id);
		const newIndex = currentSnapshotBlocks.findIndex((block) => block.id === over.id);
		currentSnapshotBlocks = arrayMove(currentSnapshotBlocks, oldIndex, newIndex);

		activeId = null;
	}

	const [send, recieve] = crossfade({ duration: 100 });
</script>

<!-- Hello {data.projectId} -->
<MediaPlayer bind:this={mediaPlayer} blocks={currentSnapshotBlocks} {selectedMediaId} />

<div class="text-foreground flex flex-col p-6">
	<MediaRecorder projectId={data.projectId} onRecordingComplete={handleRecordingComplete} />

	<BlocksList blocks={currentSnapshotBlocks} {selectedMediaId} onSelectItem={handleSelectItem} />

	<!-- <Outlet /> -->
</div>

<DndContext {sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
	<div class="text-black">
		<div class="grid gap-4 text-black md:grid-cols-2">
			{@render taskList('in-progress', 'In Progress', currentSnapshotBlocks)}
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
		<Droppable class="rounded-3xl bg-[#F9F9F9] p-3 pt-6" {id}>
			<p class="pb-3 text-lg font-bold">{title}</p>

			<div class="grid gap-2">
				{#each blocks as block (block.id)}
					<div class="" in:recieve={{ key: block.id }} out:send={{ key: block.id }}>
						<SortableItem {block} />
					</div>
				{/each}
			</div>
		</Droppable>
	</SortableContext>
{/snippet}
