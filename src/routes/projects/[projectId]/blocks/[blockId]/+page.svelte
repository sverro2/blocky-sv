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
	import { Combobox, type ComboboxOption } from '$lib/components/ui/combobox';
	import { page } from '$app/state';
	import { error } from '@sveltejs/kit';

	let { data }: PageProps = $props();

	onMount(async () => {
		await reloadBlocks();
	});

	async function reloadBlocks() {
		const projectId = page.params.projectId;
		try {
			const res = await fetch(`/api/project`, {
				method: 'POST',
				body: JSON.stringify({
					projectId
				})
			});
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
			const blocks = await res.json();
			currentSnapshotBlocks = blocks;
		} catch (error) {
			console.error('Error fetching blocks:', error);
		}
	}

	let selectedBlockId = '';

	let mediaPlayer = $state<MediaPlayer | null>(null);

	let currentSnapshotBlocks: BlockListItem[] = $state([]);

	// Stub data for combobox (about 20 items)
	const comboboxOptions = $derived(
		currentSnapshotBlocks.map((block) => ({
			value: block.id,
			label: block.blockName
		}))
	);
	let selectedValue = $state<string>('');

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
			<MediaPlayer
				bind:this={mediaPlayer}
				projectId={data.project.id}
				blocks={currentSnapshotBlocks}
				{selectedBlockId}
			/>
		</div>
		<div class="h-full">
			<div class="mt-8 p-5">
				<div class="mt-24 max-w-sm">
					<label for="option-combobox" class="mb-2 block text-sm font-medium">
						Select an option:
					</label>
					<Combobox
						id="option-combobox"
						options={comboboxOptions}
						bind:value={selectedValue}
						placeholder="Choose an option..."
						searchPlaceholder="Search options..."
					/>
				</div>
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
