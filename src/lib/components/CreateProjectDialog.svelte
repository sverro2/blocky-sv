<!--
	Responsive Project Creation Dialog Component

	This component automatically switches between:
	- Dialog (modal) on desktop screens (>=768px width)
	- Drawer (bottom sheet) on mobile screens (<768px width)

	Features:
	- Form validation using superforms with Zod
	- Progressive enhancement with use:enhance
	- Automatic form reset and dialog close on successful submission
	- Native select elements for better accessibility and form handling
-->
<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import { onMount } from 'svelte';

	let { form: formData } = $props();

	let isDesktop = $state(false);
	let open = $state(false);

	const createProjectSchema = z.object({
		name: z
			.string()
			.min(1, 'Project name is required')
			.max(32, 'Project name must be 32 characters or less'),
		mediaType: z.enum(['audio', 'video'])
	});

	const {
		form,
		enhance: formEnhance,
		errors
	} = superForm(formData, {
		validators: zodClient(createProjectSchema),
		resetForm: true,
		onUpdated: ({ form }) => {
			if (form.valid) {
				open = false;
			}
		}
	});

	// Set default media type
	$form.mediaType = $form.mediaType || 'audio';

	onMount(() => {
		const checkIsDesktop = () => {
			isDesktop = window.innerWidth >= 768;
		};

		checkIsDesktop();
		window.addEventListener('resize', checkIsDesktop);

		return () => {
			window.removeEventListener('resize', checkIsDesktop);
		};
	});
</script>

{#snippet triggerContent()}
	<div class="flex h-full w-full flex-col items-center justify-center gap-2">
		<Plus class="h-8 w-8 transition-colors duration-200" />
		<span class="text-sm font-medium transition-colors duration-200">Create Project</span>
	</div>
{/snippet}

{#snippet formContent(isMobile = false)}
	<form method="POST" action="?/createProject" use:formEnhance class={isMobile ? 'px-4' : ''}>
		<div class="space-y-4">
			<div class="space-y-2">
				<Label for={isMobile ? 'name-mobile' : 'name'}>Project Name</Label>
				<Input
					id={isMobile ? 'name-mobile' : 'name'}
					name="name"
					placeholder="Enter project name..."
					bind:value={$form.name}
					aria-invalid={$errors.name ? 'true' : undefined}
				/>
				{#if $errors.name}
					<p class="text-destructive text-sm">{$errors.name}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for={isMobile ? 'mediaType-mobile' : 'mediaType'}>Media Type</Label>
				<select
					id={isMobile ? 'mediaType-mobile' : 'mediaType'}
					name="mediaType"
					bind:value={$form.mediaType}
					class="border-input ring-offset-background placeholder:text-muted-foreground focus:ring-ring [&>option]:bg-popover [&>option]:text-popover-foreground flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
					aria-invalid={$errors.mediaType ? 'true' : undefined}
				>
					<option value="" class="bg-popover text-popover-foreground">Select media type</option>
					<option value="audio" class="bg-popover text-popover-foreground">Audio</option>
					<option value="video" class="bg-popover text-popover-foreground" disabled>Video</option>
				</select>
				{#if $errors.mediaType}
					<p class="text-destructive text-sm">{$errors.mediaType}</p>
				{/if}
			</div>
		</div>

		{#if isMobile}
			<Drawer.Footer class="mt-6">
				<Button type="submit" class="w-full">Create Project</Button>
				<Drawer.Close>
					<Button variant="outline" class="w-full">Cancel</Button>
				</Drawer.Close>
			</Drawer.Footer>
		{:else}
			<Dialog.Footer class="mt-6">
				<Dialog.Close>
					<Button variant="outline">Cancel</Button>
				</Dialog.Close>
				<Button type="submit">Create Project</Button>
			</Dialog.Footer>
		{/if}
	</form>
{/snippet}

{#if isDesktop}
	<Dialog.Root bind:open>
		<Dialog.Trigger class="flex h-full w-full">
			{@render triggerContent()}
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Create New Project</Dialog.Title>
				<Dialog.Description>
					Enter the details for your new project. Click create when you're done.
				</Dialog.Description>
			</Dialog.Header>
			{@render formContent(false)}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Trigger class="flex h-full w-full">
			{@render triggerContent()}
		</Drawer.Trigger>
		<Drawer.Content>
			<Drawer.Header>
				<Drawer.Title>Create New Project</Drawer.Title>
				<Drawer.Description>
					Enter the details for your new project. Click create when you're done.
				</Drawer.Description>
			</Drawer.Header>
			{@render formContent(true)}
		</Drawer.Content>
	</Drawer.Root>
{/if}
