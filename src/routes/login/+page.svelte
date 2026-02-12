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

	let activeTab: 'login' | 'register' = $state('login');
</script>

<div class="flex min-h-screen items-center justify-center p-6">
	<div class="w-full max-w-md space-y-6">
		<div class="text-center">
			<h1 class="text-4xl font-bold tracking-tight">Welcome</h1>
			<p class="text-muted-foreground mt-2">Sign in to your account or create a new one</p>
		</div>

		<Card class="pt-0">
			<div class="border-b">
				<div class="flex">
					<button
						type="button"
						class="flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'login'
							? 'border-primary text-primary border-b-2'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => (activeTab = 'login')}
					>
						Sign In
					</button>
					<button
						type="button"
						class="flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'register'
							? 'border-primary text-primary border-b-2'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => (activeTab = 'register')}
					>
						Register
					</button>
				</div>
			</div>

			{#if activeTab === 'login'}
				<div>
					<CardHeader>
						<CardTitle>Sign In</CardTitle>
						<CardDescription>Enter your credentials to access your account</CardDescription>
					</CardHeader>
					<CardContent class="pt-4">
						<form class="space-y-4" method="post" action="?/login" use:enhance>
							{#if data.returnUrl}
								<input type="hidden" name="returnUrl" value={data.returnUrl} />
							{/if}

							<div class="space-y-2">
								<Label for="login-username">Username</Label>
								<Input
									id="login-username"
									name="username"
									type="text"
									placeholder="Enter your username"
									required
								/>
							</div>

							<div class="space-y-2">
								<Label for="login-password">Password</Label>
								<Input
									id="login-password"
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

							<div class="pt-2">
								<Button type="submit" class="w-full">Sign In</Button>
							</div>
						</form>
					</CardContent>
				</div>
			{:else}
				<div>
					<CardHeader>
						<CardTitle>Register</CardTitle>
						<CardDescription>Create a new account to get started</CardDescription>
					</CardHeader>
					<CardContent class="pt-4">
						<form class="space-y-4" method="post" action="?/register" use:enhance>
							{#if data.returnUrl}
								<input type="hidden" name="returnUrl" value={data.returnUrl} />
							{/if}

							<div class="space-y-2">
								<Label for="register-username">Username</Label>
								<Input
									id="register-username"
									name="username"
									type="text"
									placeholder="Choose a username"
									required
								/>
							</div>

							<div class="space-y-2">
								<Label for="register-email">Email</Label>
								<Input
									id="register-email"
									name="email"
									type="email"
									placeholder="Enter your email"
									required
								/>
							</div>

							<div class="space-y-2">
								<Label for="register-password">Password</Label>
								<Input
									id="register-password"
									name="password"
									type="password"
									placeholder="Choose a password"
									required
								/>
							</div>

							{#if form?.message}
								<div class="border-destructive/20 bg-destructive/10 rounded-lg border p-3">
									<p class="text-destructive text-sm">{form.message}</p>
								</div>
							{/if}

							<div class="pt-2">
								<Button type="submit" class="w-full">Create Account</Button>
							</div>
						</form>
					</CardContent>
				</div>
			{/if}
		</Card>
	</div>
</div>
