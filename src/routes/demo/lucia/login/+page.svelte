<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="p-3">
	<h1 class="mb-3 text-5xl">Please login to start</h1>
	<form class="flex max-w-96 flex-col gap-3" method="post" action="?/login" use:enhance>
		<label>
			<div>Username</div>
			<input
				name="username"
				class="bg-backdrop focus:border-passion focus:ring-passion mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:outline-none"
			/>
		</label>
		<label>
			<div>Password</div>
			<input
				type="password"
				name="password"
				class="bg-backdrop focus:border-passion focus:ring-passion mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:outline-none"
			/>
		</label>

		<div class="flex grow gap-2">
			<button class="bg-passion hover:bg-passion-light rounded-md px-4 py-2 text-white transition"
				>Login</button
			>
			<button
				formaction="?/register"
				class="bg-passion hover:bg-passion-light rounded-md px-4 py-2 text-white transition"
				>Register</button
			>
		</div>
	</form>
	<p style="color: red">{form?.message ?? ''}</p>
</div>
