import { requireAuth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { project, projectSnapshot } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import type { SnapshotDataV1Dao } from '$lib/types/project-snapshot-v1';

export const load: PageServerLoad = async (event) => {
	const user = requireAuth(event);
	const projectId = event.params.projectId;

	try {
		// Fetch the project and verify ownership
		const projectInfo = await db
			.select()
			.from(project)
			.where(and(eq(project.id, projectId), eq(project.userId, user.id)))
			.limit(1);

		if (projectInfo.length === 0) {
			throw error(404, 'Project not found');
		}

		const rawProjectSnapshot = await db
			.select()
			.from(projectSnapshot)
			.where(eq(projectSnapshot.projectId, projectId))
			.limit(1);

		if (rawProjectSnapshot.length === 0) {
			throw error(404, 'No project data found');
		}

		const snapshotDao = rawProjectSnapshot[0].body_dao as SnapshotDataV1Dao;

		const blocksList = snapshotDao.blocks.map((block) => ({
			id: block.id,
			name: block.name
		}));

		return {
			project: projectInfo[0],
			blocksList,
			user
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
