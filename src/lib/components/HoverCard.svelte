<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import type { Snippet } from 'svelte';

	interface Props {
		href?: string;
		class?: string;
		hoverScale?: boolean;
		hoverShadow?: boolean;
		hoverBorder?: boolean;
		children: Snippet;
	}

	let {
		href,
		class: className = '',
		hoverScale = true,
		hoverShadow = true,
		hoverBorder = false,
		children
	}: Props = $props();

	const hoverClasses = $derived(() => {
		const classes = ['cursor-pointer', 'transition-all', 'duration-200'];

		if (hoverScale) classes.push('hover:scale-105');
		if (hoverShadow) classes.push('hover:shadow-lg');
		if (hoverBorder) classes.push('hover:border-primary/50');

		return classes.join(' ');
	});

	const cardClass = $derived(`${hoverClasses} ${className}`);
</script>

{#if href}
	<a {href} class="block h-full">
		<Card class={cardClass}>
			{@render children()}
		</Card>
	</a>
{:else}
	<Card class={cardClass}>
		{@render children()}
	</Card>
{/if}
