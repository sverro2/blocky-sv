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
		menuItems?: Snippet;
		backButton?: {
			icon: typeof LucideIcon;
			href?: string;
			onclick?: () => void;
		};
	}

	let { title, menuItems, backButton }: Props = $props();
</script>

<div class="bg-background sticky top-0 px-5">
	<div class="flex items-center justify-between gap-4">
		<div class="flex min-w-0 flex-1 items-center gap-4">
			<!-- Back Button (optional) -->
			{#if backButton}
				<Button
					variant="outline"
					size="sm"
					href={backButton.href}
					onclick={backButton.onclick}
					class="text-muted-foreground hover:text-foreground shrink-0"
				>
					{@const Icon = backButton.icon}
					<Icon class="mr-2 h-4 w-4" />
					Back
				</Button>
			{/if}

			<!-- Title and Subtitle -->
			<div class="flex min-w-0 py-2">
				<h1 class="truncate text-2xl font-bold tracking-tight">{title}</h1>
			</div>
		</div>

		<!-- Right Side Actions - Always stay on the right -->
		<div class="flex shrink-0 items-center gap-2">
			<!-- Hamburger Menu (Right Side) -->
			<Drawer direction="top">
				<DrawerTrigger>
					<Button variant="ghost" size="icon">
						<Menu class="mt-2 -mr-5 h-5 w-5" />
					</Button>
				</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Menu</DrawerTitle>
						<DrawerDescription>Access your options</DrawerDescription>
					</DrawerHeader>
					<div class="space-y-4 p-4 pb-8">
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
