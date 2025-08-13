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
					},
					{
						currentMediaId: 'asdf',
						id: 'fdsa',
						media: [{ mediaId: 'zxcv' }, { mediaId: 'asdf' }]
					},
					{
						currentMediaId: 'fgh',
						id: 'mnbv',
						media: [{ mediaId: 'masdfsd' }, { mediaId: 'asdf' }]
					},
					{
						currentMediaId: 'dfgh',
						id: 'uiy',
						media: [{ mediaId: 'masdfsd' }, { mediaId: 'asdf' }]
					},
					{
						currentMediaId: 'm,k.m',
						id: 'hjf',
						media: [{ mediaId: 'masdfsd' }, { mediaId: 'asdf' }]
					},
					{
						currentMediaId: 'aoipub',
						id: 'bjfgc',
						media: [{ mediaId: 'masdfsd' }, { mediaId: 'asdf' }]
					},
					{
						currentMediaId: 'vbvcef',
						id: 'efliug',
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

	let showEditor = $state(false);
</script>

<div class="flex">
	<div id="project-overview">
		<MediaPlayer bind:this={mediaPlayer} blocks={currentSnapshotBlocks} {selectedMediaId} />
		<input type="checkbox" bind:checked={showEditor} />

		<div class="flex flex-col p-6">
			<!-- <MediaRecorder projectId={data.projectId} onRecordingComplete={handleRecordingComplete} /> -->

			<BlocksList
				blocks={currentSnapshotBlocks}
				{selectedMediaId}
				onSelectItem={handleSelectItem}
			/>
		</div>
	</div>
	<div id="block-editor" class="grow bg-red-500"></div>
</div>
