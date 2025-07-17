<script lang="ts">
	import { onMount } from 'svelte';
	import { toastStore } from '$lib/utils/toast';
	import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from 'lucide-svelte';

	let toasts = $state(toastStore);

	function getToastIcon(type: string) {
		switch (type) {
			case 'success':
				return CheckCircleIcon;
			case 'error':
				return XCircleIcon;
			case 'warning':
				return AlertTriangleIcon;
			case 'info':
				return InfoIcon;
			default:
				return InfoIcon;
		}
	}

	function getToastClasses(type: string) {
		const baseClasses = 'rounded-lg border p-4 shadow-lg transition-all duration-300';
		switch (type) {
			case 'success':
				return `${baseClasses} bg-green-50 border-green-200 text-green-800`;
			case 'error':
				return `${baseClasses} bg-red-50 border-red-200 text-red-800`;
			case 'warning':
				return `${baseClasses} bg-orange-50 border-orange-200 text-orange-800`;
			case 'info':
				return `${baseClasses} bg-blue-50 border-blue-200 text-blue-800`;
			default:
				return `${baseClasses} bg-gray-50 border-gray-200 text-gray-800`;
		}
	}

	function getIconColor(type: string) {
		switch (type) {
			case 'success':
				return 'text-green-600';
			case 'error':
				return 'text-red-600';
			case 'warning':
				return 'text-orange-600';
			case 'info':
				return 'text-blue-600';
			default:
				return 'text-gray-600';
		}
	}

	function dismissToast(id: string) {
		toastStore.remove(id);
	}
</script>

<!-- Toast Container -->
<div class="toast-container fixed top-4 right-4 z-50 flex max-w-sm flex-col gap-2">
	{#each $toasts.toasts as toast (toast.id)}
		<div class={getToastClasses(toast.type)} role="alert">
			<div class="flex items-start gap-3">
				<!-- Icon -->
				<div class={`flex-shrink-0 ${getIconColor(toast.type)}`}>
					{#if getToastIcon(toast.type)}
						{@const IconComponent = getToastIcon(toast.type)}
						<IconComponent size={20} />
					{/if}
				</div>

				<!-- Message -->
				<div class="flex-1 text-sm font-medium">
					{toast.message}
				</div>

				<!-- Dismiss Button -->
				{#if toast.dismissible}
					<button
						onclick={() => dismissToast(toast.id)}
						class="flex-shrink-0 opacity-70 transition-opacity hover:opacity-100"
						title="Dismiss notification"
					>
						<XIcon size={16} />
					</button>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		pointer-events: none;
	}

	.toast-container > div {
		pointer-events: auto;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.toast-container {
			left: 1rem;
			right: 1rem;
			top: 1rem;
			max-width: none;
		}
	}
</style>
