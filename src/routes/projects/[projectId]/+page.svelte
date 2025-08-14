<script lang="ts">
	import type { Snapshot } from '$lib/client/idb';

	import type { PageProps } from './$types';
	import { onMount } from 'svelte';

	import MediaPlayer from '$lib/components/MediaPlayer.svelte';
	import BlocksList from '$lib/components/BlocksList.svelte';
	import ResponsiveProjectContainer from '$lib/components/ResponsiveProjectContainer.svelte';

	let { data: _data }: PageProps = $props();

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

	let showEditor = $state(false);

	$effect(() => {
		console.log('showEditor changed:', showEditor);
	});
</script>

<ResponsiveProjectContainer bind:showEditor {overview} {editor}></ResponsiveProjectContainer>

{#snippet overview()}
	<div id="project-blocks-overview">
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
{/snippet}

{#snippet editor()}
	<div id="block-editor" class="h-full bg-red-500">
		<button onclick={() => (showEditor = !showEditor)}>Test</button>
	</div>
{/snippet}
