import { db } from '$lib/server/db';
import { project, projectSnapshot } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { PageServerLoad, Actions } from './$types';
import { logger } from '$lib/utils/logger';
import { createNewSnapshot } from '$lib/types/project-snapshot-v1';

const createProjectSchema = z.object({
	name: z
		.string()
		.min(1, 'Project name is required')
		.max(32, 'Project name must be 32 characters or less'),
	mediaType: z.enum(['audio', 'video'])
});

export const load: PageServerLoad = async (event) => {
	const user = requireAuth(event);

	const projects = (
		await db.query.project.findMany({
			where: (project, { eq }) => eq(project.userId, user.id),
			orderBy: (project, { desc }) => desc(project.createdAt)
		})
	).filter((e) => e.userId === user.id);

	const form = await superValidate(zod(createProjectSchema));

	return {
		projects,
		user,
		form
	};
};

export const actions: Actions = {
	createProject: async (event) => {
		const user = requireAuth(event);
		const form = await superValidate(event, zod(createProjectSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		let newProjectId = null;
		try {
			await db.transaction(async (tx) => {
				const now = new Date();
				const [newProject] = await tx
					.insert(project)
					.values({
						id: randomUUID(),
						name: form.data.name,
						mediaType: form.data.mediaType,
						userId: user.id,
						createdAt: now
					})
					.returning();

				newProjectId = newProject.id;

				await tx.insert(projectSnapshot).values({
					id: randomUUID(),
					projectId: newProjectId,
					modifiedAt: now,
					name: undefined,
					isAutosafe: true,
					body_dao: createNewSnapshot(),
					body_dao_version: 'V1'
				});
			});
		} catch (error) {
			logger.error('Error creating project:', error);
			return fail(500, { form, error: 'Failed to create project' });
		}

		if (newProjectId) {
			redirect(303, `/projects/${newProjectId}`);
		}
	}
};
