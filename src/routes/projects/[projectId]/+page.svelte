<script lang="ts">
	import type { PageProps } from './$types';

	import MediaPlayer from '$lib/components/MediaPlayer.svelte';
	import BlocksList from '$lib/components/BlocksList.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { ListIcon, LogOutIcon, Settings } from 'lucide-svelte';
	import ResponsiveHeader from '$lib/components/ResponsiveHeader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { selectedBlockStore, getSelectedBlockId } from '$lib/stores';

	let { data }: PageProps = $props();

	let currentSnapshotBlocks: BlockListItem[] = $derived(
		data.blocksList.map((block) => ({
			id: block.id,
			blockName: block.name,
			currentAlternativeName: block.currentAlternativeName
		}))
	);

	let mediaPlayer = $state<MediaPlayer | null>(null);

	function handleSelectBlock(id: string) {
		selectedBlockStore.set(id);
	}

	// Update store when currentSnapshotBlocks changes
	$effect(() => {
		const validId = getSelectedBlockId(currentSnapshotBlocks);
		selectedBlockStore.set(validId);
	});
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
			<MediaPlayer
				bind:this={mediaPlayer}
				projectId={data.project.id}
				blocks={currentSnapshotBlocks}
				selectedBlockId={$selectedBlockStore}
			/>
		</div>
		<div class="h-full">
			<div class="mt-8">
				<BlocksList
					blocks={currentSnapshotBlocks}
					selectedBlockId={$selectedBlockStore}
					onSelectItem={handleSelectBlock}
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
