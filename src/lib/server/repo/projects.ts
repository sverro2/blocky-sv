import { randomUUID, type UUID } from 'crypto';
import { db } from '../db';
import { project, projectSnapshot } from '../db/schema';
import { createNewSnapshot } from '$lib/types/project-snapshot-v1';
import type { SuperValidated } from 'sveltekit-superforms';
import type { CreateProjectForm } from '$lib/schemas/forms';

export async function getProjectList(userId: string) {
	const projects = (
		await db.query.project.findMany({
			where: (project, { eq }) => eq(project.userId, userId),
			orderBy: (project, { desc }) => desc(project.createdAt)
		})
	).filter((e) => e.userId === userId);

	return projects;
}

export async function createProject(
	userId: string,
	form: SuperValidated<CreateProjectForm>
): Promise<string> {
	const projectId = await db.transaction(async (tx) => {
		const now = new Date();
		const [newProject] = await tx
			.insert(project)
			.values({
				id: randomUUID(),
				name: form.data.name,
				mediaType: form.data.mediaType,
				userId: userId,
				createdAt: now
			})
			.returning();

		await tx.insert(projectSnapshot).values({
			id: randomUUID(),
			projectId: newProject.id,
			modifiedAt: now,
			name: undefined,
			isAutosafe: true,
			body_dao: createNewSnapshot(),
			body_dao_version: 'V1'
		});

		return newProject.id;
	});

	return projectId;
}
