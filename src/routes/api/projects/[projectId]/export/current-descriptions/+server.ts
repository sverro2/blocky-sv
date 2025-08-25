import { requireAuth } from '$lib/server/repo/auth';
import { db } from '$lib/server/db';
import { project, projectSnapshot } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { SnapshotDataV1Dao } from '$lib/types/project-snapshot-v1';
import JSZip from 'jszip';

export const GET: RequestHandler = async (event) => {
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

		// Get project snapshot
		const rawProjectSnapshot = await db
			.select()
			.from(projectSnapshot)
			.where(eq(projectSnapshot.projectId, projectId))
			.limit(1);

		if (rawProjectSnapshot.length === 0) {
			throw error(404, 'Project snapshot not found');
		}

		const snapshot = rawProjectSnapshot[0].body_dao as SnapshotDataV1Dao;

		// Extract current alternative descriptions only
		let currentDescriptions = '';

		snapshot.blocks.forEach((block, blockIndex) => {
			// Find the current alternative
			const currentAlternative = block.alternatives.find((alt) => alt.id === block.currentAltId);

			if (!currentAlternative) {
				// Skip blocks without a valid current alternative
				return;
			}

			currentDescriptions += `--- Block ${blockIndex + 1}: ${block.name} ---\n`;
			if (block.description) {
				currentDescriptions += `Block Description: ${block.description}\n`;
			}
			currentDescriptions += '\n';

			currentDescriptions += `Current Alternative: ${currentAlternative.name}\n`;
			if (currentAlternative.description) {
				currentDescriptions += `Description: ${currentAlternative.description}\n`;
			}
			currentDescriptions += `Modified: ${currentAlternative.modifiedAtIsoString}\n\n`;

			currentDescriptions += '\n';
		});

		// Create zip file
		const zip = new JSZip();
		const fileName = `${projectData[0].name}_current_descriptions.txt`;
		zip.file(fileName, currentDescriptions);

		// Generate zip content
		const zipContent = await zip.generateAsync({ type: 'uint8array' });

		// Return the zip file as response
		return new Response(zipContent, {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${projectData[0].name}_current_descriptions.zip"`
			}
		});
	} catch (err) {
		// If it's already an error we threw, re-throw it
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		// Otherwise, return a generic error
		throw error(500, 'Failed to export current descriptions');
	}
};
