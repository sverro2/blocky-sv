<script lang="ts">
	import type { Snapshot } from '$lib/client/idb';

	import type { PageProps } from './$types';
	import { onMount } from 'svelte';

	import MediaPlayer from '$lib/components/MediaPlayer.svelte';
	import BlocksList from '$lib/components/BlocksList.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { ListIcon, LogOutIcon, Settings } from 'lucide-svelte';
	import ResponsiveHeader from '$lib/components/ResponsiveHeader.svelte';
	import { Button } from '$lib/components/ui/button';

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
		// let media = await getCurrentSnapshot(data.project.id);
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
</script>

<PageLayout>
	<div class="flex flex-col">
		<div class="sticky top-0 z-10">
			<ResponsiveHeader
				title={data.project.name}
				{desktopActions}
				{mobileMenuItems}
				{desktopMenuItems}
				backButton={{ icon: ListIcon, href: '../' }}
			/>
			<MediaPlayer bind:this={mediaPlayer} blocks={currentSnapshotBlocks} {selectedMediaId} />
		</div>
		<div class="h-full">
			<div class="mt-8">
				<BlocksList
					blocks={currentSnapshotBlocks}
					{selectedMediaId}
					onSelectItem={handleSelectItem}
				/>
			</div>
		</div>
	</div>
</PageLayout>

{#snippet mobileMenuItems()}
	<a
		href="/projects/{data.project.id}/config"
		class="flex w-full items-center rounded p-2 text-left hover:bg-gray-100"
	>
		<Settings class="mr-2 h-4 w-4" />
		Settings
	</a>
{/snippet}

{#snippet desktopMenuItems()}
	<Button variant="ghost" href="/projects/{data.project.id}/config" class="w-full justify-start">
		<Settings class="mr-2 h-4 w-4" />
		Settings
	</Button>
	<Button
		variant="ghost"
		href="/logout"
		data-sveltekit-preload-data="off"
		class="w-full justify-start"
	>
		<LogOutIcon class="mr-2 h-4 w-4" />
		Sign out
	</Button>
{/snippet}

{#snippet desktopActions()}
	<Button variant="ghost">Save Project</Button>
{/snippet}
