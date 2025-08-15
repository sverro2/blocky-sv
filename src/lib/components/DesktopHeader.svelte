<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Icon as LucideIcon } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import { EllipsisVerticalIcon } from 'lucide-svelte';

	interface Props {
		backButton?: {
			icon: typeof LucideIcon;
			href?: string;
			onclick?: () => void;
		};
		title: string;
		desktopActions?: Snippet;
		menuItems?: Snippet;
	}

	let { backButton, title, desktopActions, menuItems }: Props = $props();
</script>

<div class="bg-background sticky top-0 z-10 space-y-4 px-5 pt-5">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-4">
			<!-- Back Button (optional) -->
			{#if backButton}
				<Button
					variant="outline"
					size="sm"
					href={backButton.href}
					onclick={backButton.onclick}
					class="text-muted-foreground hover:text-foreground shrink-0 px-3 py-2"
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
		<div class="center relative flex gap-4">
			<!-- Desktop Actions -->
			{#if desktopActions}
				{@render desktopActions()}
			{/if}

			<!-- Hamburger Menu (Right Side) -->
			<DropdownMenu align="right">
				{#snippet trigger()}
					<EllipsisVerticalIcon class="h-6 w-6" />
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
