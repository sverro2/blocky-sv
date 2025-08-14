import { requireAuth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = requireAuth(event);
	const projectId = event.params.projectId;

	try {
		// Fetch the project and verify ownership
		const projectData = await db
			.select()
			.from(project)
			.where(and(eq(project.id, projectId), eq(project.userId, user.id)))
			.limit(1);

		if (projectData.length === 0) {
			throw error(404, 'Project not found');
		}

		return {
			project: projectData[0]
		};
	} catch (err) {
		// If it's already an error we threw, re-throw it
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		// Database error (including invalid UUID format)
		throw error(404, 'Project not found');
	}
};

export const actions = {
	updateProject: async (event) => {
		const user = requireAuth(event);
		const projectId = event.params.projectId;
		const formData = await event.request.formData();

		const name = formData.get('name')?.toString().trim();
		const description = formData.get('description')?.toString().trim() || null;

		if (!name || name.length === 0) {
			return {
				error: 'Project name is required'
			};
		}

		if (name.length > 32) {
			return {
				error: 'Project name must be 32 characters or less'
			};
		}

		try {
			// Verify project ownership
			const projectData = await db
				.select()
				.from(project)
				.where(and(eq(project.id, projectId), eq(project.userId, user.id)))
				.limit(1);

			if (projectData.length === 0) {
				throw error(404, 'Project not found');
			}

			// Update the project
			await db
				.update(project)
				.set({
					name,
					description
				})
				.where(eq(project.id, projectId));

			redirect(302, `/projects/${projectId}`);
		} catch (err) {
			// If it's already an error we threw, re-throw it
			if (err && typeof err === 'object' && 'status' in err) {
				throw err;
			}
			// Otherwise, return a form error
			return {
				error: 'Failed to update project'
			};
		}
	},

	deleteProject: async (event) => {
		const user = requireAuth(event);
		const projectId = event.params.projectId;

		try {
			// Verify project ownership
			const projectData = await db
				.select()
				.from(project)
				.where(and(eq(project.id, projectId), eq(project.userId, user.id)))
				.limit(1);

			if (projectData.length === 0) {
				throw error(404, 'Project not found');
			}

			// Delete the project
			await db.delete(project).where(eq(project.id, projectId));

			redirect(302, '/projects');
		} catch (err) {
			// If it's already an error we threw, re-throw it
			if (err && typeof err === 'object' && 'status' in err) {
				throw err;
			}
			// Otherwise, it's likely a database error, return 404
			throw error(404, 'Project not found');
		}
	}
} satisfies Actions;
