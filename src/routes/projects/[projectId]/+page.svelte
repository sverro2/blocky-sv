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
	import { fly } from 'svelte/transition';

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
	let isMobile = $state(true);

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 1024;
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});

	$effect(() => {
		console.log('showEditor changed:', showEditor);
	});
</script>

<div class="relative h-screen overflow-hidden lg:flex">
	<!-- Shared Overview Content -->
	<div
		id="project-blocks-overview"
		class="h-full w-full overflow-x-hidden overflow-y-auto lg:w-auto lg:shrink-0 lg:!translate-x-0 lg:border-r lg:!opacity-100"
		style:transform={showEditor && isMobile ? 'translateX(-100%)' : 'translateX(0)'}
		style:opacity={showEditor && isMobile ? '0' : '1'}
		style:transition="transform 300ms ease-in-out, opacity 300ms ease-in-out"
	>
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

	<!-- Shared Editor Content -->
	<div
		id="block-editor"
		class="absolute inset-0 h-full w-full overflow-y-auto bg-red-500 lg:relative lg:flex-1"
		style:transform={!showEditor && isMobile ? 'translateX(100%)' : 'translateX(0)'}
		style:opacity={!showEditor && isMobile ? '0' : '1'}
		style:transition="transform 300ms ease-in-out, opacity 300ms ease-in-out"
	>
		<button onclick={() => (showEditor = !showEditor)}>Test</button>
	</div>
</div>
