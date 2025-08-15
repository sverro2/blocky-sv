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

	let { data }: PageProps = $props();

	let currentSnapshot = $state<Snapshot | undefined>(undefined);

	let currentSnapshotBlocks = $derived(
		currentSnapshot === undefined ? [] : currentSnapshot?.data.blocks
	);

	let mediaPlayer = $state<MediaPlayer | null>(null);

	// Stub data for combobox (about 20 items)
	const comboboxOptions: ComboboxOption[] = [
		{ value: 'option1', label: 'First Option Item' },
		{ value: 'option2', label: 'Second Option Item' },
		{ value: 'option3', label: 'Third Option Item' },
		{ value: 'option4', label: 'Fourth Option Item' },
		{ value: 'option5', label: 'Fifth Option Item' },
		{ value: 'option6', label: 'Sixth Option Item' },
		{ value: 'option7', label: 'Seventh Option Item' },
		{ value: 'option8', label: 'Eighth Option Item' },
		{ value: 'option9', label: 'Ninth Option Item' },
		{ value: 'option10', label: 'Tenth Option Item' },
		{ value: 'option11', label: 'Eleventh Option Item' },
		{ value: 'option12', label: 'Twelfth Option Item' },
		{ value: 'option13', label: 'Thirteenth Option Item' },
		{ value: 'option14', label: 'Fourteenth Option Item' },
		{ value: 'option15', label: 'Fifteenth Option Item' },
		{ value: 'option16', label: 'Sixteenth Option Item' },
		{ value: 'option17', label: 'Seventeenth Option Item' },
		{ value: 'option18', label: 'Eighteenth Option Item' },
		{ value: 'option19', label: 'Nineteenth Option Item' },
		{ value: 'option20', label: 'Twentieth Option Item' }
	];

	let selectedValue = $state<string>('');

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
