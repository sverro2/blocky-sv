<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Settings, ArrowLeft, Save, Trash2 } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let name = $state(data.project.name);
	let description = $state(data.project.description || '');
	let isDeleteDialogOpen = $state(false);
	let isSubmitting = $state(false);
	let isDeleting = $state(false);

	function handleUpdateSubmit() {
		isSubmitting = true;
	}

	function handleDeleteSubmit() {
		isDeleting = true;
	}
</script>

<svelte:head>
	<title>Config - {data.project.name} | Blocky</title>
</svelte:head>

<div class="container max-w-2xl py-8">
	<div class="mb-8">
		<Button variant="ghost" href="/projects/{data.project.id}" class="mb-4 -ml-4">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back to Project
		</Button>
		<div class="flex items-center gap-3">
			<Settings class="h-6 w-6" />
			<div>
				<h1 class="text-2xl font-bold">Project Settings</h1>
				<p class="text-muted-foreground">Configure your project details and settings</p>
			</div>
		</div>
	</div>

	<div class="space-y-6">
		<!-- Project Details Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Project Details</Card.Title>
				<Card.Description>Update your project name and description</Card.Description>
			</Card.Header>
			<Card.Content>
				<form method="POST" action="?/updateProject" use:enhance onsubmit={handleUpdateSubmit}>
					<div class="space-y-4">
						<div class="space-y-2">
							<Label for="name">Project Name</Label>
							<Input
								id="name"
								name="name"
								bind:value={name}
								placeholder="Enter project name"
								maxlength={32}
								required
							/>
							<p class="text-muted-foreground text-sm">{name.length}/32 characters</p>
						</div>

						<div class="space-y-2">
							<Label for="description">Description</Label>
							<textarea
								id="description"
								name="description"
								bind:value={description}
								placeholder="Enter project description (optional)"
								rows="3"
								class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							></textarea>
						</div>

						<div class="flex justify-end">
							<Button type="submit" disabled={isSubmitting}>
								{#if isSubmitting}
									<div
										class="border-primary mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
									></div>
									Saving...
								{:else}
									<Save class="mr-2 h-4 w-4" />
									Save Changes
								{/if}
							</Button>
						</div>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Danger Zone Card -->
		<Card.Root class="border-destructive/20">
			<Card.Header>
				<Card.Title class="text-destructive">Danger Zone</Card.Title>
				<Card.Description>
					Permanently remove this project and all of its data. This action cannot be undone.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Button
					variant="destructive"
					onclick={() => (isDeleteDialogOpen = true)}
					disabled={isDeleting}
				>
					<Trash2 class="mr-2 h-4 w-4" />
					Delete Project
				</Button>
			</Card.Content>
		</Card.Root>
	</div>
</div>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete your project
				<strong>"{data.project.name}"</strong> and remove all of its data from our servers.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/deleteProject"
				use:enhance
				onsubmit={handleDeleteSubmit}
				class="inline"
			>
				<AlertDialog.Action type="submit" disabled={isDeleting}>
					{#if isDeleting}
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
						Deleting...
					{:else}
						Delete Project
					{/if}
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
