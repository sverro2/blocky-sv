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
		StepForwardIcon,
		TrashIcon
	} from 'lucide-svelte';
	import ResponsiveHeader from '$lib/components/ResponsiveHeader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Combobox, type ComboboxOption } from '$lib/components/ui/combobox';
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogTrigger
	} from '$lib/components/ui/alert-dialog';
	import { page } from '$app/state';
	import { error } from '@sveltejs/kit';
	import { goto, invalidateAll, refreshAll } from '$app/navigation';
	import type { BlockListItemDto } from '$lib/api/block-list-item-dto';
	import type { AlternativeListItemDto } from '$lib/api/alternative-list-item-dto';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import DebouncedTextarea from '$lib/components/ui/textarea/DebouncedTextarea.svelte';
	import DebouncedInput from '$lib/components/ui/input/DebouncedInput.svelte';
	import type { BlockMetaUpdateDto } from '$lib/api/block-meta-update-dto';
	import type { AlternativeMetaUpdateDto } from '$lib/api/alternative-meta-update-dto';
	import { AddBlockLocationDto, type AddBlockDto } from '$lib/api/add-block-dto';
	import type { NewBlockIdDto } from '$lib/api/new-block-id-dto';
	import { selectedBlockStore } from '$lib/stores';

	let { data }: PageProps = $props();

	let projectId = $derived(data.projectId);
	let currentBlockId = $derived(data.currentBlockId);
	let currentBlockName: string = $derived(data.currentBlockName);
	let currentBlockDescription: string | undefined = $derived(data.currentBlockDescription);
	let currentAlternativeId = $derived(data.currentAlternativeId);
	let currentAlternativeName: string = $derived(data.currentAlternativeName);
	let currentAlternativeDescription: string | undefined = $derived(
		data.currentAlternativeDescription
	);

	let blocksList: BlockListItem[] = $derived(data.blocksList);
	let alternativeList: ComboboxOption[] = $derived(data.alternativeList);

	$effect(() => {
		selectedBlockStore.set(currentBlockId);
	});

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

	async function confirmRemoveBlock() {
		try {
			const res = await fetch(`/api/projects/${projectId}/blocks/${currentBlockId}`, {
				method: 'DELETE'
			});

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}

			const response = await res.json();

			// Redirect to the remaining block or back to project list
			await goto(`/projects/${projectId}/blocks/${response.redirectToBlockId}`);
		} catch (error) {
			console.error('Error deleting block:', error);
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

	// Stub data for combobox (about 20 items)
	const comboboxOptions = $derived(
		blocksList.map((block) => ({
			value: block.id,
			label: block.blockName
		}))
	);

	// function handleSelectItem(id: string) {
	// 	selectedMediaId = id;
	// 	if (mediaPlayer) {
	// 		mediaPlayer.playMedia();
	// 	}
	// }

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

	async function handleAlternativeChange() {
		await updateBlockInfo();

		invalidateAll();
	}

	function checkNameValidity(input: string) {
		return input.length > 1;
	}

	async function addBlockAround(location: AddBlockLocationDto) {
		const input: AddBlockDto = {
			location
		};
		try {
			const res = await fetch(`/api/projects/${projectId}/blocks/${currentBlockId}`, {
				method: 'POST',
				body: JSON.stringify(input)
			});
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}

			const response = (await res.json()) as NewBlockIdDto;
			await goto(`/projects/${projectId}/blocks/${response.newBlockId}`);
		} catch (error) {
			console.error('Error adding new block:', error);
		}
	}

	async function addAlternative() {
		try {
			const res = await fetch(`/api/projects/${projectId}/blocks/${currentBlockId}/alternatives`, {
				method: 'POST'
			});
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
			await reloadPage();
		} catch (error) {
			console.error('Error adding new alternative:', error);
		}
	}

	async function reloadPage() {
		await goto(`/projects/${projectId}/blocks/${currentBlockId}`, { invalidateAll: true });
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
				{projectId}
				blocks={blocksList}
				selectedBlockId={currentBlockId}
				showEditButton={false}
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
						<Button
							title="Add block before"
							onclick={() => addBlockAround(AddBlockLocationDto.Before)}
						>
							<PlusIcon /><StepBackIcon></StepBackIcon>
						</Button>
						<div class="grow">
							<Combobox
								id="option-combobox"
								options={comboboxOptions}
								bind:value={currentBlockId}
								placeholder="Choose an option..."
								searchPlaceholder="Search options..."
								onchange={async (value) => {
									if (value) {
										await goto(`/projects/${projectId}/blocks/${value}`);
									}
								}}
							/>
						</div>
						<Button
							title="Add block after"
							onclick={() => addBlockAround(AddBlockLocationDto.After)}
						>
							<StepForwardIcon /><PlusIcon />
						</Button>
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
							onchange={handleAlternativeChange}
						/>
					</div>
					<Button title="Add alternative to block" onclick={() => addAlternative()}>
						<PlusIcon />
					</Button>
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

{#snippet mobileMenuItems(closeDrawer: () => void)}
	<AlertDialog>
		<AlertDialogTrigger
			class="flex w-full cursor-pointer items-center rounded p-2 text-left hover:bg-gray-100"
		>
			<TrashIcon class="mr-2 h-4 w-4" />
			Remove block
		</AlertDialogTrigger>
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>Are you sure you want to delete this block?</AlertDialogTitle>
				<AlertDialogDescription>
					This action cannot be undone. This will permanently delete the block "{currentBlockName}"
					and all its alternatives.
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel onclick={closeDrawer}>Cancel</AlertDialogCancel>
				<AlertDialogAction
					onclick={() => {
						confirmRemoveBlock();
						closeDrawer();
					}}>Delete Block</AlertDialogAction
				>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
	<a
		href="/projects/{projectId}/config"
		class="flex w-full items-center rounded p-2 text-left hover:bg-gray-100"
		onclick={closeDrawer}
	>
		<Settings class="mr-2 h-4 w-4" />
		Settings
	</a>
	<a
		href="/logout"
		class="flex w-full items-center rounded p-2 text-left hover:bg-gray-100"
		onclick={closeDrawer}
	>
		<LogOutIcon class="mr-2 h-4 w-4" />
		Logout
	</a>
{/snippet}

{#snippet desktopMenuItems()}
	<AlertDialog>
		<AlertDialogTrigger class="w-full">
			<Button variant="ghost" class="w-full justify-start">
				<TrashIcon class="mr-2 h-4 w-4" />
				Remove block
			</Button>
		</AlertDialogTrigger>
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>Are you sure you want to delete this block?</AlertDialogTitle>
				<AlertDialogDescription>
					This action cannot be undone. This will permanently delete the block "{currentBlockName}"
					and all its alternatives.
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel>Cancel</AlertDialogCancel>
				<AlertDialogAction onclick={confirmRemoveBlock}>Delete Block</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
	<Button variant="ghost" href="/projects/{projectId}/config" class="w-full justify-start">
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
