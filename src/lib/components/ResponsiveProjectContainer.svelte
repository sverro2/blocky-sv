<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	interface Props {
		showEditor?: boolean;
		overview: Snippet;
		editor: Snippet;
	}

	let { showEditor = $bindable(false), overview, editor }: Props = $props();

	let isMobile = $state(true);

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 1024;
		};

		// Initial check
		checkMobile();

		// Listen for resize events
		window.addEventListener('resize', checkMobile);

		// Cleanup
		return () => window.removeEventListener('resize', checkMobile);
	});
</script>

<div class="relative h-screen overflow-hidden lg:flex">
	<!-- Overview Panel -->
	<div
		class="relative z-20 h-full w-full overflow-x-hidden overflow-y-auto lg:w-auto lg:shrink-0 lg:!translate-x-0 lg:border-r lg:!opacity-100"
		style:transform={showEditor && isMobile ? 'translateX(-100%)' : 'translateX(0)'}
		style:opacity={showEditor && isMobile ? '0' : '1'}
		style:transition="transform 300ms ease-in-out, opacity 300ms ease-in-out"
		style:box-shadow={!isMobile
			? '4px 0 6px -1px rgb(0 0 0 / 0.1), 2px 0 4px -2px rgb(0 0 0 / 0.1)'
			: 'none'}
	>
		{@render overview()}
	</div>

	<!-- Editor Panel -->
	<div
		class="absolute inset-0 z-10 h-full w-full overflow-y-auto lg:relative lg:flex-1"
		style:transform={!showEditor && isMobile ? 'translateX(100%)' : 'translateX(0)'}
		style:opacity={!showEditor && isMobile ? '0' : '1'}
		style:transition="transform 300ms ease-in-out, opacity 300ms ease-in-out"
	>
		{@render editor()}
	</div>
</div>
