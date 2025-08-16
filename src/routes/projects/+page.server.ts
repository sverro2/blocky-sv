import { db } from '$lib/server/db';
import { project, projectSnapshot } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/repo/auth';
import { fail, redirect } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad, Actions } from './$types';
import { createProject, getProjectList } from '$lib/server/repo/projects';
import { createProjectSchema } from '$lib/schemas/forms';

export const load: PageServerLoad = async (event) => {
	const user = requireAuth(event);
	const projects = await getProjectList(user.id);
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

		const newProjectId = await createProject(user.id, form);

		if (newProjectId) {
			redirect(303, `/projects/${newProjectId}`);
		}
	}
};
