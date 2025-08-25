<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Combobox from '$lib/components/ui/combobox';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import ResponsiveHeader from '$lib/components/ResponsiveHeader.svelte';
	import { Download, ListIcon, LogOutIcon } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { User as UserType } from '$lib/server/db/schema';

	let { data }: { data: PageData & { user: UserType } } = $props();

	let selectedExportType = $state('');
	let isExporting = $state(false);

	const exportOptions = [
		{ value: 'project-mp3', label: 'Project to MP3' },
		{ value: 'descriptions-txt', label: 'Alternate descriptions to TXT' },
		{ value: 'current-descriptions-txt', label: 'Current alternate descriptions to TXT' }
	];

	function handleExport() {
		if (
			selectedExportType === 'descriptions-txt' ||
			selectedExportType === 'current-descriptions-txt'
		) {
			isExporting = true;

			const endpoint =
				selectedExportType === 'current-descriptions-txt'
					? `/api/projects/${data.project.id}/export/current-descriptions`
					: `/api/projects/${data.project.id}/export/descriptions`;

			// Create a hidden link and trigger download directly
			const a = document.createElement('a');
			a.href = endpoint;
			a.style.display = 'none';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			// Reset loading state after a short delay
			setTimeout(() => {
				isExporting = false;
			}, 1000);
		} else {
			alert('Sorry Bernd, dit is nog niet geimplementeerd :(');
		}
	}
</script>

<PageLayout>
	<ResponsiveHeader
		backButton={{ icon: ListIcon, href: '.' }}
		title="Export Project"
		{mobileMenuItems}
		{desktopMenuItems}
	/>

	<div class="container max-w-2xl space-y-6 p-5">
		<!-- Export Options Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Export Options</Card.Title>
				<Card.Description>Choose what you'd like to export from your project</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="space-y-6">
					<div class="space-y-2">
						<Label for="export-type">Export Type</Label>
						<Combobox.Root
							id="export-type"
							options={exportOptions}
							bind:value={selectedExportType}
							placeholder="Select export type..."
							class="w-full"
						/>
					</div>

					<div class="flex justify-end">
						<Button onclick={handleExport} disabled={!selectedExportType || isExporting}>
							{#if isExporting}
								<div
									class="border-primary mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
								></div>
								Exporting...
							{:else}
								<Download class="mr-2 h-4 w-4" />
								Export
							{/if}
						</Button>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</PageLayout>

{#snippet mobileMenuItems()}
	<Button
		variant="ghost"
		href="/logout"
		class="w-full justify-start"
		data-sveltekit-preload-data="off"
	>
		<LogOutIcon class="mr-2 h-4 w-4" />
		Sign out
	</Button>
{/snippet}

{#snippet desktopMenuItems()}
	<Button
		variant="ghost"
		href="/logout"
		class="w-full justify-start"
		data-sveltekit-preload-data="off"
	>
		<LogOutIcon class="mr-2 h-4 w-4" />
		Sign out
	</Button>
{/snippet}
