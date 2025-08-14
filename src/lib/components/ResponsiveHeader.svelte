<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
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
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import { Menu } from 'lucide-svelte';

	interface Props {
		title: string;
		subtitle?: string;
		username?: string;
		mobileMenuItems?: Snippet;
		desktopMenuItems?: Snippet;
		desktopActions?: Snippet;
	}

	let { title, subtitle, username, mobileMenuItems, desktopMenuItems, desktopActions }: Props =
		$props();

	let isMobile = $state(true);

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 1024;
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});
</script>

<div class="space-y-4">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-4">
			<!-- Mobile Hamburger (Drawer) -->
			{#if isMobile}
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
							{#if mobileMenuItems}
								{@render mobileMenuItems()}
							{/if}
						</div>
					</DrawerContent>
				</Drawer>
			{:else}
				<!-- Desktop Hamburger (Dropdown) -->
				<DropdownMenu align="left">
					{#snippet trigger()}
						<Button variant="ghost" size="icon">
							<Menu class="h-5 w-5" />
						</Button>
					{/snippet}
					{#snippet content()}
						{#if desktopMenuItems}
							{@render desktopMenuItems()}
						{/if}
					{/snippet}
				</DropdownMenu>
			{/if}

			<!-- Title and Subtitle -->
			<div>
				<h1 class="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
				{#if subtitle}
					<p class="text-muted-foreground hidden md:block">{subtitle}</p>
				{/if}
			</div>
		</div>

		<!-- Desktop Actions and User Info -->
		<div class="flex items-center gap-4">
			<!-- Desktop Actions (e.g., other buttons/components) -->
			{#if !isMobile && desktopActions}
				{@render desktopActions()}
			{/if}
		</div>
	</div>
	<Separator />
</div>
