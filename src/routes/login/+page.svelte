<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { data, form } = $props();
</script>

<div class="flex min-h-screen items-center justify-center p-6">
	<div class="w-full max-w-md space-y-6">
		<div class="text-center">
			<h1 class="text-4xl font-bold tracking-tight">Welcome Back</h1>
			<p class="text-muted-foreground mt-2">Please sign in to your account</p>
		</div>

		<Card>
			<CardHeader>
				<CardTitle>Sign In</CardTitle>
				<CardDescription>Enter your credentials to access your account</CardDescription>
			</CardHeader>
			<CardContent>
				<form class="space-y-4" method="post" action="?/login" use:enhance>
					{#if data.returnUrl}
						<input type="hidden" name="returnUrl" value={data.returnUrl} />
					{/if}

					<div class="space-y-2">
						<Label for="username">Username</Label>
						<Input
							id="username"
							name="username"
							type="text"
							placeholder="Enter your username"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="password">Password</Label>
						<Input
							id="password"
							name="password"
							type="password"
							placeholder="Enter your password"
							required
						/>
					</div>

					{#if form?.message}
						<div class="border-destructive/20 bg-destructive/10 rounded-lg border p-3">
							<p class="text-destructive text-sm">{form.message}</p>
						</div>
					{/if}

					<div class="flex gap-3 pt-2">
						<Button type="submit" class="flex-1">Sign In</Button>
						<Button type="submit" variant="outline" formaction="?/register" class="flex-1">
							Register
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
