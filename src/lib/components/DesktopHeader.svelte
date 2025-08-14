<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import { Menu } from 'lucide-svelte';

	interface Props {
		title: string;
		subtitle?: string;
		username?: string;
		menuItems?: Snippet;
		leftActions?: Snippet;
		centerActions?: Snippet;
		rightActions?: Snippet;
	}

	let { title, subtitle, username, menuItems, leftActions, centerActions, rightActions }: Props = $props();
</script>

<div class="space-y-4">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-4">
			<!-- Left Actions (optional) -->
			{#if leftActions}
				{@render leftActions()}
			{/if}

			<!-- Title and Subtitle -->
			<div>
				<h1 class="text-3xl font-bold tracking-tight">{title}</h1>
				{#if subtitle}
					<p class="text-muted-foreground hidden md:block">{subtitle}</p>
				{/if}
			</div>
		</div>

		<!-- Right Side Actions -->
		<div class="flex items-center gap-4">
			<!-- Center Actions (between user info and hamburger) -->
			{#if centerActions}
				{@render centerActions()}
			{/if}

			<!-- Right Actions (before user info) -->
			{#if rightActions}
				{@render rightActions()}
			{/if}

			<!-- User Info -->
			{#if username}
				<span class="text-muted-foreground text-sm">Welcome, {username}</span>
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
