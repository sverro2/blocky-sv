<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import type { Snippet } from 'svelte';

	interface Props {
		href?: string;
		class?: string;
		children: Snippet;
	}

	let { href, class: className = '', children }: Props = $props();

	const cardClass = $derived(
		`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:border-primary/50 ${className}`
	);
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
