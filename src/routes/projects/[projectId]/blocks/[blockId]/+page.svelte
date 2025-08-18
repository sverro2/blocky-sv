<script lang="ts">
	import type { Snapshot } from '$lib/client/idb';

	import type { PageProps } from './$types';
	import { onMount } from 'svelte';

	import MediaPlayer from '$lib/components/MediaPlayer.svelte';
	import BlocksList from '$lib/components/BlocksList.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import {
		ListIcon,
		LogOutIcon,
		PlusIcon,
		Settings,
		StepBackIcon,
		StepForwardIcon
	} from 'lucide-svelte';
	import ResponsiveHeader from '$lib/components/ResponsiveHeader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Combobox, type ComboboxOption } from '$lib/components/ui/combobox';
	import { page } from '$app/state';
	import { error } from '@sveltejs/kit';
	import { goto } from '$app/navigation';
	import type { BlockListItemDto } from '$lib/api/block-list-item-dto';
	import type { AlternativeListItemDto } from '$lib/api/alternative-list-item-dto';

	let { data }: PageProps = $props();

	let projectId = $state(data.project.id);
	let currentBlockId = $state(page.params.blockId);
	let currentAlternativeId = $state('');

	onMount(async () => {
		await reloadBlocks();
		await reloadAlternatives();

		if (!blocksList.find((block) => block.id === currentBlockId)) {
			goto(`/projects/${data.project.id}`);
		}
	});

	async function reloadBlocks() {
		try {
			const res = await fetch(`/api/projects/${projectId}/blocks`, {
				method: 'GET'
			});
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
			const blocks = (await res.json()) as BlockListItemDto[];

			const parsedBlocks: BlockListItem[] = blocks.map((block: BlockListItemDto) => ({
				id: block.id,
				blockName: block.name,
				currentAlternativeName: block.currentAlternativeName
			}));

			// Make sure the current selected alternative is updated with the new data
			const currentBlock = blocks.find((block) => block.id === currentBlockId)!;
			currentAlternativeId = currentBlock.currentAlternativeId;

			blocksList = parsedBlocks;
		} catch (error) {
			console.error('Error fetching blocks:', error);
		}
	}

	async function reloadAlternatives() {
		try {
			const res = await fetch(`/api/projects/${projectId}/blocks/${currentBlockId}`, {
				method: 'GET'
			});
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
			const alternatives = await res.json();
			alternativeList = alternatives.map((alternative: AlternativeListItemDto) => ({
				value: alternative.id,
				label: alternative.name
			}));
		} catch (error) {
			console.error('Error fetching alternatives:', error);
		}
	}

	let mediaPlayer = $state<MediaPlayer | null>(null);

	let blocksList: BlockListItem[] = $state([]);
	let alternativeList: ComboboxOption[] = $state([]);

	// Stub data for combobox (about 20 items)
	const comboboxOptions = $derived(
		blocksList.map((block) => ({
			value: block.id,
			label: block.blockName
		}))
	);

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
				blocks={blocksList}
				selectedBlockId={currentBlockId}
			/>
		</div>
		<div class="h-full">
			<div class="mt-8 flex flex-col gap-4 p-5">
				<div>
					<label for="option-combobox" class="mb-2 block text-sm font-medium">
						Currently editing block:
					</label>
					<div class="flex max-w-sm items-end gap-4">
						<Button><PlusIcon /><StepBackIcon /></Button>
						<div class="grow">
							<Combobox
								id="option-combobox"
								options={comboboxOptions}
								bind:value={currentBlockId}
								placeholder="Choose an option..."
								searchPlaceholder="Search options..."
							/>
						</div>
						<Button><StepForwardIcon /><PlusIcon /></Button>
					</div>
				</div>
				<div class="flex max-w-sm items-end gap-4">
					<div class="max-w-sm grow">
						<label for="option-combobox" class="mb-2 block text-sm font-medium">
							Pick your alternative for this block:
						</label>
						<Combobox
							id="option-combobox"
							options={alternativeList}
							bind:value={currentAlternativeId}
							placeholder="Choose an option..."
							searchPlaceholder="Search options..."
						/>
					</div>
					<Button><PlusIcon /></Button>
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
