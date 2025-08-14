<script lang="ts">
	import type { Snippet, SvelteComponent } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import { Menu } from 'lucide-svelte';

	interface Props {
		backButton?: {
			icon: typeof SvelteComponent;

			href?: string;
			onclick?: () => void;
		};
		title: string;
		desktopActions?: Snippet;
		menuItems?: Snippet;
	}

	let { backButton, title, desktopActions, menuItems }: Props = $props();
</script>

<div class="space-y-4">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-4">
			<!-- Back Button (optional) -->
			{#if backButton}
				<Button
					variant="ghost"
					size="sm"
					href={backButton.href}
					onclick={backButton.onclick}
					class="shrink-0"
				>
					{@const Icon = backButton.icon}
					<Icon class="mr-2 h-4 w-4" />
					Back
				</Button>
			{/if}

			<!-- Title and Subtitle -->
			<div>
				<h1 class="text-3xl font-bold tracking-tight">{title}</h1>
			</div>
		</div>

		<!-- Right Side Actions -->
		<div class="flex items-center gap-4">
			<!-- Desktop Actions -->
			{#if desktopActions}
				{@render desktopActions()}
			{/if}

			<!-- Hamburger Menu (Right Side) -->
			<DropdownMenu align="right">
				{#snippet trigger()}
					<Button variant="ghost" size="icon">
						<Menu class="h-5 w-5" />
					</Button>
				{/snippet}
				{#snippet content()}
					{#if menuItems}
						{@render menuItems()}
					{/if}
				{/snippet}
			</DropdownMenu>
		</div>
	</div>
	<Separator />
</div>
