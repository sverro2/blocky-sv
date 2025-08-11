<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<!-- Full screen container with centered content -->
<div
	class="from-backdrop to-backdrop/80 flex min-h-screen items-center justify-center bg-gradient-to-br p-6"
>
	<!-- Login card -->
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="mb-8 text-center">
			<h1 class="text-foreground mb-2 text-4xl font-bold">Welcome Back</h1>
			<p class="text-foreground/70">Please sign in to your account</p>
		</div>

		<!-- Form card -->
		<div class="bg-backdrop/50 border-foreground/10 rounded-xl border p-8 shadow-2xl backdrop-blur">
			<form class="space-y-6" method="post" action="?/login" use:enhance>
				<!-- Username field -->
				<div>
					<label for="username" class="text-foreground/90 mb-2 block text-sm font-medium">
						Username
					</label>
					<input
						id="username"
						name="username"
						type="text"
						required
						class="bg-backdrop/60 border-foreground/20 text-foreground placeholder-foreground/50 focus:border-passion focus:ring-passion/20 w-full rounded-lg border px-4 py-3 transition-all duration-200 focus:ring-2 focus:outline-none"
						placeholder="Enter your username"
					/>
				</div>

				<!-- Password field -->
				<div>
					<label for="password" class="text-foreground/90 mb-2 block text-sm font-medium">
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="bg-backdrop/60 border-foreground/20 text-foreground placeholder-foreground/50 focus:border-passion focus:ring-passion/20 w-full rounded-lg border px-4 py-3 transition-all duration-200 focus:ring-2 focus:outline-none"
						placeholder="Enter your password"
					/>
				</div>

				<!-- Error message -->
				{#if form?.message}
					<div class="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
						<p class="text-sm text-red-400">{form.message}</p>
					</div>
				{/if}

				<!-- Buttons -->
				<div class="flex gap-3 pt-2">
					<button
						type="submit"
						class="bg-passion hover:bg-passion-light focus:ring-passion/50 flex-1 transform rounded-lg px-4 py-3 font-medium text-white transition-all duration-200 hover:scale-[1.02] focus:ring-2 focus:outline-none"
					>
						Sign In
					</button>
					<button
						type="submit"
						formaction="?/register"
						class="border-passion text-passion hover:bg-passion focus:ring-passion/50 flex-1 rounded-lg border bg-transparent px-4 py-3 font-medium transition-all duration-200 hover:text-white focus:ring-2 focus:outline-none"
					>
						Register
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
