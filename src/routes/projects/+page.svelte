<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	let { data } = $props();
</script>

<div class="bg-background min-h-screen">
	<div class="container mx-auto space-y-6 p-6">
		<!-- Header -->
		<div class="space-y-4">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="text-3xl font-bold tracking-tight">Your Projects</h1>
					<p class="text-muted-foreground">Manage and organize your ideas</p>
				</div>
				<div class="flex items-center gap-4">
					<span class="text-muted-foreground text-sm">Welcome, {data.user.username}</span>
					<Button variant="outline" href="/logout">Sign out</Button>
				</div>
			</div>
			<Separator />
		</div>

		<!-- Projects Grid -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			<!-- Create Project Card -->
			<Card
				class="hover:border-primary/50 cursor-pointer border-dashed transition-all duration-200 hover:scale-105 hover:shadow-lg"
			>
				<CardContent class="flex flex-col items-center justify-center gap-4 py-8">
					<Plus class="group-hover:text-primary h-16 w-16 transition-colors duration-200" />
					<span class="group-hover:text-primary text-sm font-medium transition-colors duration-200"
						>Create Project</span
					>
				</CardContent>
			</Card>
			{#each data.projects as project (project.id)}
				<Card class="cursor-pointer transition-shadow hover:shadow-md">
					<a href="/projects/{project.id}" class="block h-full">
						<CardHeader>
							<div class="flex items-center justify-between">
								<CardTitle class="text-lg">{project.name}</CardTitle>
								<Badge variant="secondary">Active</Badge>
							</div>
							{#if project.description}
								<CardDescription>{project.description}</CardDescription>
							{:else}
								<CardDescription class="text-muted-foreground/50">No description</CardDescription>
							{/if}
						</CardHeader>
						<CardContent>
							<div class="text-muted-foreground text-sm">
								Created: {new Date(project.createdAt).toLocaleDateString()}
							</div>
						</CardContent>
					</a>
				</Card>
			{/each}
		</div>
	</div>
</div>
