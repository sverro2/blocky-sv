<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useMobile } from '$lib/utils/mobile.svelte.js';

	interface Props {
		showEditor?: boolean;
		overview: Snippet;
		editor: Snippet;
	}

	let { showEditor = $bindable(false), overview, editor }: Props = $props();

	const mobile = useMobile();
</script>

<div class="relative h-screen lg:flex">
	<!-- Overview Panel -->
	<div
		class="relative z-20 h-full w-full lg:w-auto lg:shrink-0 lg:!translate-x-0 lg:border-r lg:!opacity-100"
		style:transform={showEditor && mobile.isMobile ? 'translateX(-100%)' : 'translateX(0)'}
		style:opacity={showEditor && mobile.isMobile ? '0' : '1'}
		style:transition="transform 300ms ease-in-out, opacity 300ms ease-in-out"
		style:box-shadow={!mobile.isMobile
			? '4px 0 6px -1px rgb(0 0 0 / 0.1), 2px 0 4px -2px rgb(0 0 0 / 0.1)'
			: 'none'}
	>
		{@render overview()}
	</div>

	<!-- Editor Panel -->
	<div
		class="absolute inset-0 z-10 h-full w-full overflow-y-auto lg:relative lg:flex-1"
		style:transform={!showEditor && mobile.isMobile ? 'translateX(100%)' : 'translateX(0)'}
		style:opacity={!showEditor && mobile.isMobile ? '0' : '1'}
		style:transition="transform 300ms ease-in-out, opacity 300ms ease-in-out"
	>
		{@render editor()}
	</div>
</div>
