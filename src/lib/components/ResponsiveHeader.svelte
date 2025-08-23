<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Icon as LucideIcon } from 'lucide-svelte';
	import MobileHeader from '$lib/components/MobileHeader.svelte';
	import DesktopHeader from '$lib/components/DesktopHeader.svelte';
	import { useMobile } from '$lib/utils/mobile.svelte.js';

	interface Props {
		backButton?: {
			icon: typeof LucideIcon;
			href?: string;
			onclick?: () => void;
		};
		title: string;
		mobileMenuItems?: Snippet<[() => void]>;
		desktopMenuItems?: Snippet;
		desktopActions?: Snippet;
	}

	let { backButton, title, mobileMenuItems, desktopMenuItems, desktopActions }: Props = $props();

	const mobile = useMobile();
</script>

{#if mobile.isMobile}
	<MobileHeader {backButton} {title} menuItems={mobileMenuItems} />
{:else}
	<DesktopHeader {backButton} {title} {desktopActions} menuItems={desktopMenuItems} />
{/if}
