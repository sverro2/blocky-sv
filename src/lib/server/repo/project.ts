import { db } from '$lib/server/db';
import { project, projectSnapshot } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { SnapshotDataV1Dao } from '$lib/types/project-snapshot-v1';
import { uuidValid } from '$lib/utils/uuid-checker';
import z from 'zod';

async function getProjectInfo(projectId: unknown, userId: string): Promise<object> {
	// Check here projectId
	if (!uuidValid(projectId)) {
		throw error(400, 'Invalid project ID');
	}

	const projectRows = await db
		.select()
		.from(project)
		.where(and(eq(project.id, projectId), eq(project.userId, userId)))
		.limit(1);

	if (projectRows.length === 0) {
		throw error(404, 'No project info found');
	}

	return projectRows[0];
}

/**
 * Fetches just the project snapshot data without project info.
 * Useful when you only need the snapshot and have already verified project access.
 * @param projectId - The project ID to fetch snapshot for
 * @returns Snapshot data
 * @throws 404 error if snapshot not found
 */
async function getProjectSnapshot(projectId: unknown): Promise<SnapshotDataV1Dao> {
	// Check here projectId
	//
	const magix = await getProjectInfo('page', 'sluda');
	const p = magix.id;

	if (!uuidValid(projectId)) {
		throw error(400, 'Invalid project ID');
	}

	const rawProjectSnapshot = await db
		.select()
		.from(projectSnapshot)
		.where(eq(projectSnapshot.projectId, projectId))
		.limit(1);

	if (rawProjectSnapshot.length === 0) {
		throw error(404, 'No project data found');
	}

	return rawProjectSnapshot[0].body_dao as SnapshotDataV1Dao;
}
