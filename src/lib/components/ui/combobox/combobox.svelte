<script lang="ts">
	import { Check, ChevronDown } from 'lucide-svelte';
	import { cn } from '$lib/utils.js';
	import { Input } from '$lib/components/ui/input';
	import { tick } from 'svelte';

	interface ComboboxOption {
		value: string;
		label: string;
	}

	let {
		options = [],
		value = $bindable(''),
		placeholder = 'Select an option...',
		searchPlaceholder = 'Search...',
		class: className = '',
		disabled = false,
		id,
		...restProps
	}: {
		options: ComboboxOption[];
		value?: string;
		placeholder?: string;
		searchPlaceholder?: string;
		class?: string;
		disabled?: boolean;
		id?: string;
	} = $props();

	let open = $state(false);
	let search = $state('');
	let triggerRef = $state<HTMLButtonElement>();
	let showAbove = $state(false);

	const filteredOptions = $derived(
		options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()))
	);

	const selectedOption = $derived(options.find((option) => option.value === value));

	function selectOption(option: ComboboxOption) {
		value = option.value;
		search = '';
		open = false;
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) {
			search = '';
		} else if (triggerRef) {
			// Check if there's enough space below, otherwise show above
			const rect = triggerRef.getBoundingClientRect();
			const dropdownHeight = Math.min(320, window.innerHeight * 0.33); // 20rem or 33vh
			const spaceBelow = window.innerHeight - rect.bottom;
			const spaceAbove = rect.top;

			showAbove = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			open = false;
			search = '';
		}
	}

	$effect(() => {
		if (open && selectedOption) {
			tick().then(() => {
				const selectedElement = document.querySelector(`[data-value="${selectedOption.value}"]`);
				if (selectedElement) {
					selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
				}
			});
		}
	});
</script>

<div class={cn('relative', className)} {...restProps}>
	<button
		bind:this={triggerRef}
		type="button"
		role="combobox"
		aria-expanded={open}
		aria-haspopup="listbox"
		aria-controls="combobox-options"
		{id}
		class={cn(
			"border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none select-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			!selectedOption && 'text-muted-foreground'
		)}
		{disabled}
		onclick={() => !disabled && handleOpenChange(!open)}
	>
		<span class="truncate">
			{selectedOption ? selectedOption.label : placeholder}
		</span>
		<ChevronDown class="h-4 w-4 shrink-0 opacity-50" />
	</button>

	{#if open}
		<div
			class="bg-popover absolute z-50 max-h-[min(20rem,33vh)] w-full rounded-md border shadow-md {showAbove
				? 'bottom-full mb-1'
				: 'top-full mt-1'}"
			style="min-width: {triggerRef?.offsetWidth}px;"
		>
			<div class="p-2">
				<Input
					bind:value={search}
					placeholder={searchPlaceholder}
					class="h-8"
					onkeydown={handleKeydown}
					autofocus
				/>
			</div>
			<div
				id="combobox-options"
				class="overflow-auto p-1"
				style="max-height: calc(min(20rem, 33vh) - 4rem);"
			>
				{#if filteredOptions.length === 0}
					<div class="text-muted-foreground py-6 text-center text-sm">No options found.</div>
				{:else}
					{#each filteredOptions as option (option.value)}
						<button
							type="button"
							data-value={option.value}
							class={cn(
								'hover:bg-accent hover:text-accent-foreground relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none',
								option.value === value && 'bg-accent text-accent-foreground'
							)}
							onclick={() => selectOption(option)}
						>
							<Check
								class={cn('mr-2 h-4 w-4', option.value === value ? 'opacity-100' : 'opacity-0')}
							/>
							{option.label}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Click outside to close -->
{#if open}
	<div
		class="fixed inset-0 z-40"
		role="button"
		tabindex="-1"
		onclick={() => handleOpenChange(false)}
		onkeydown={(e) => e.key === 'Enter' && handleOpenChange(false)}
	></div>
{/if}
