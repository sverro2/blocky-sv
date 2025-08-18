<script lang="ts">
	import { Input } from './index.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		type,
		files = $bindable(),
		class: className,
		onvalidchange,
		isValid = () => true,
		...restProps
	}: {
		ref?: HTMLInputElement | null;
		value?: string;
		type?: string;
		files?: FileList;
		class?: string;
		onvalidchange: (value: string) => void;
		isValid?: (value: string) => boolean;
	} & Record<string, unknown> = $props();

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function handleInput() {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		debounceTimer = setTimeout(() => {
			if (isValid(value || '')) {
				onvalidchange(value || '');
			}
		}, 1500);
	}

	function handleBlur() {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}

		if (isValid(value || '')) {
			onvalidchange(value || '');
		}
	}
</script>

{#if type === 'file'}
	<Input
		bind:ref
		bind:value
		bind:files
		{type}
		class={className}
		oninput={handleInput}
		onblur={handleBlur}
		{...restProps}
	/>
{:else}
	<Input
		bind:ref
		bind:value
		{type}
		class={className}
		oninput={handleInput}
		onblur={handleBlur}
		{...restProps}
	/>
{/if}
