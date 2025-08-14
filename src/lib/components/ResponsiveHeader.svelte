<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import MobileHeader from '$lib/components/MobileHeader.svelte';
	import DesktopHeader from '$lib/components/DesktopHeader.svelte';

	interface Props {
		title: string;
		subtitle?: string;
		username?: string;
		mobileMenuItems?: Snippet;
		desktopMenuItems?: Snippet;
		leftActions?: Snippet;
		centerActions?: Snippet;
		desktopActions?: Snippet;
	}

	let {
		title,
		subtitle,
		username,
		mobileMenuItems,
		desktopMenuItems,
		leftActions,
		centerActions,
		desktopActions
	}: Props = $props();

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
	<MobileHeader {title} {subtitle} {username} menuItems={mobileMenuItems} {leftActions} />
{:else}
	<DesktopHeader
		{title}
		{subtitle}
		{username}
		menuItems={desktopMenuItems}
		{leftActions}
		{centerActions}
		rightActions={desktopActions}
	/>
{/if}
