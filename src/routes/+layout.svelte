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
