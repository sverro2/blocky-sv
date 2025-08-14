<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Icon as LucideIcon } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Drawer,
		DrawerContent,
		DrawerDescription,
		DrawerHeader,
		DrawerTitle,
		DrawerTrigger
	} from '$lib/components/ui/drawer';
	import { Menu } from 'lucide-svelte';

	interface Props {
		title: string;
		subtitle?: string;
		username?: string;
		menuItems?: Snippet;
		backButton?: {
			icon: typeof LucideIcon;
			href?: string;
			onclick?: () => void;
		};
	}

	let { title, subtitle, username, menuItems, backButton }: Props = $props();
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between gap-4">
		<div class="flex min-w-0 flex-1 items-center gap-4">
			<!-- Back Button (optional) -->
			{#if backButton}
				<Button
					variant="outline"
					size="sm"
					href={backButton.href}
					onclick={backButton.onclick}
					class="text-muted-foreground hover:text-foreground -ml-2 shrink-0 px-2 py-1.5"
				>
					{@const Icon = backButton.icon}
					<Icon class="mr-2 h-4 w-4" />
					Back
				</Button>
			{/if}

			<!-- Title and Subtitle -->
			<div class="min-w-0 flex-1">
				<h1 class="truncate text-2xl font-bold tracking-tight">{title}</h1>
				{#if subtitle}
					<p class="text-muted-foreground truncate text-sm">{subtitle}</p>
				{/if}
			</div>
		</div>

		<!-- Right Side Actions - Always stay on the right -->
		<div class="flex shrink-0 items-center gap-2">
			<!-- Hamburger Menu (Right Side) -->
			<Drawer>
				<DrawerTrigger>
					<Button variant="ghost" size="icon">
						<Menu class="h-5 w-5" />
					</Button>
				</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Menu</DrawerTitle>
						<DrawerDescription>Access your options</DrawerDescription>
					</DrawerHeader>
					<div class="space-y-4 p-4 pb-8">
						{#if username}
							<div class="text-muted-foreground border-b pb-4 text-center text-sm">
								Welcome, {username}
							</div>
						{/if}
						{#if menuItems}
							{@render menuItems()}
						{/if}
					</div>
				</DrawerContent>
			</Drawer>
		</div>
	</div>
	<Separator />
</div>
