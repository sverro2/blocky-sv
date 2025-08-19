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
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import DebouncedTextarea from '$lib/components/ui/textarea/DebouncedTextarea.svelte';
	import DebouncedInput from '$lib/components/ui/input/DebouncedInput.svelte';
	import type { BlockMetaUpdateDto } from '$lib/api/block-meta-update-dto';
	import type { AlternativeMetaUpdateDto } from '$lib/api/alternative-meta-update-dto';

	let { data }: PageProps = $props();

	let projectId = $state(data.project.id);
	let currentBlockId = $state(page.params.blockId);
	let currentBlockName: string = $state('');
	let currentBlockDescription: string | undefined = $state('');
	let currentAlternativeId = $state('');
	let currentAlternativeName: string = $state('');
	let currentAlternativeDescription: string | undefined = $state('');

	onMount(async () => {
		await reloadBlocks();
		await reloadAlternatives();

		// If block requested in url can not be found in current block list, return!
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

			// Make sure the currently selected alternative is updated with the new data
			const currentBlock = blocks.find((block) => block.id === currentBlockId)!;
			currentAlternativeId = currentBlock.currentAlternativeId;

			// Also figure out the name of the current block
			currentBlockName = currentBlock.name;
			currentBlockDescription = currentBlock.blockDescription;

			// And the name of current alternative
			currentAlternativeName = currentBlock.currentAlternativeName;
			currentAlternativeDescription = currentBlock.alternativeDescription;

			// Then update the whole list
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

	async function updateBlockInfo() {
		const updated: BlockMetaUpdateDto = {
			name: currentBlockName,
			alternativeId: currentAlternativeId,
			description: currentBlockDescription
		};
		try {
			const res = await fetch(`/api/projects/${projectId}/blocks/${currentBlockId}`, {
				method: 'PUT',
				body: JSON.stringify(updated)
			});
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
		} catch (error) {
			console.error('Error fetching alternatives:', error);
		}
	}

	async function updateAlternativeInfo() {
		const updated: AlternativeMetaUpdateDto = {
			name: currentAlternativeName,
			description: currentAlternativeDescription
		};
		try {
			const res = await fetch(
				`/api/projects/${projectId}/blocks/${currentBlockId}/alternatives/${currentAlternativeId}`,
				{
					method: 'PUT',
					body: JSON.stringify(updated)
				}
			);
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
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

	async function handleBlockNameInputChange(input: string) {
		await updateBlockInfo();

		// Update current view without reloading data (to prevent inputs from being overriden while still typing)
		blocksList = blocksList.map((block) => {
			if (block.id === currentBlockId) {
				return { ...block, blockName: input };
			} else {
				return block;
			}
		});
	}

	async function handleAlternativeInputChange(input: string) {
		await updateAlternativeInfo();
		alternativeList = alternativeList.map((alternative) => {
			if (alternative.value === currentAlternativeId) {
				return { ...alternative, label: input };
			} else {
				return alternative;
			}
		});

		blocksList = blocksList.map((block) => {
			if (block.id === currentBlockId) {
				return { ...block, currentAlternativeName: input };
			} else {
				return block;
			}
		});
	}

	function checkNameValidity(input: string) {
		return input.length > 1;
	}
</script>

<PageLayout>
	<div class="flex flex-col">
		<div class="sticky top-0 z-10">
			<ResponsiveHeader
				title="Block editor"
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
			<div class="flex justify-center bg-amber-400 p-2 text-center sm:mx-5">
				Alternative recorded at 13-02-2025
			</div>
		</div>
		<div class="h-full">
			<div class="flex flex-col gap-4 px-5 pt-4">
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
								onchange={async (value) => {
									if (value) {
										console.log(`You changed block value to ${value}`);
									}
								}}
							/>
						</div>
						<Button><StepForwardIcon /><PlusIcon /></Button>
					</div>
				</div>
				<DebouncedInput
					placeholder="Block name"
					type="text"
					bind:value={currentBlockName}
					class="max-w-96"
					isValid={checkNameValidity}
					onvalidchange={handleBlockNameInputChange}
				/>
				<DebouncedTextarea
					placeholder="No description added yet."
					bind:value={currentBlockDescription}
					rows={4}
					onvalidchange={updateBlockInfo}
					class="max-w-[50em]"
				/>

				<Separator orientation="horizontal" />
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
				<DebouncedInput
					type="text"
					bind:value={currentAlternativeName}
					isValid={checkNameValidity}
					onvalidchange={handleAlternativeInputChange}
					class="max-w-96"
				/>
				<DebouncedTextarea
					bind:value={currentAlternativeDescription}
					onvalidchange={updateAlternativeInfo}
					placeholder="No description added yet."
					class="max-w-[50em]"
					rows={4}
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
