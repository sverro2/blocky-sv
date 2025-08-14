<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Icon as LucideIcon } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import MobileHeader from '$lib/components/MobileHeader.svelte';
	import DesktopHeader from '$lib/components/DesktopHeader.svelte';

	interface Props {
		backButton?: {
			icon: typeof LucideIcon;
			href?: string;
			onclick?: () => void;
		};
		title: string;
		mobileMenuItems?: Snippet;
		desktopMenuItems?: Snippet;
		desktopActions?: Snippet;
	}

	let { backButton, title, mobileMenuItems, desktopMenuItems, desktopActions }: Props = $props();

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

{#if isMobile}
	<MobileHeader {backButton} {title} menuItems={mobileMenuItems} />
{:else}
	<DesktopHeader {backButton} {title} {desktopActions} menuItems={desktopMenuItems} />
{/if}
