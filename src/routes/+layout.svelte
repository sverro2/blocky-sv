<script lang="ts">
	import '../app.css';
	import { onNavigate } from '$app/navigation';

	let { children } = $props();

	onNavigate((navigation) => {
		if (!document.startViewTransition) {
			// Fallback for browsers without View Transitions API
			return new Promise((resolve) => {
				document.body.style.opacity = '0';
				document.body.style.transition = 'opacity 0.15s ease-out';

				setTimeout(async () => {
					resolve();
					await navigation.complete;
					document.body.style.opacity = '1';
					setTimeout(() => {
						document.body.style.transition = '';
					}, 150);
				}, 150);
			});
		}

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

{@render children()}

<style>
	:global(::view-transition-old(root)) {
		animation: slide-out 0.2s ease-out;
	}

	:global(::view-transition-new(root)) {
		animation: slide-in 0.2s ease-out;
	}

	@keyframes slide-out {
		to {
			transform: translateX(-100%);
			opacity: 0;
		}
	}

	@keyframes slide-in {
		from {
			transform: translateX(-100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
</style>
