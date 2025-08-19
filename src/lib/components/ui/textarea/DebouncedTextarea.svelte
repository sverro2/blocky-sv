<script lang="ts">
	import { Textarea } from './index.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		onvalidchange,
		isValid = () => true,
		...restProps
	}: {
		ref?: HTMLTextAreaElement | null;
		value?: string;
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
		}, 1000);
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

<Textarea
	bind:ref
	bind:value
	class={className}
	oninput={handleInput}
	onblur={handleBlur}
	{...restProps}
/>
