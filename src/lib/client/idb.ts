import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// Filecache store

interface MyDB extends DBSchema {
	fileCacheStore: {
		key: number;
		value: CachedMedia;
		indexes: {
			byProjectId: string;
		};
	};
}

export interface CachedMedia {
	mediaId: string;
	projectId: string;
}

let db_connection: IDBPDatabase<MyDB> | null = null;

async function db(): Promise<IDBPDatabase<MyDB>> {
	if (db_connection === null) {
		console.log('creating indexedDB connection');
		db_connection = await openDB<MyDB>('audiospire', 1.0, {
			upgrade(db, _oldVersion, _newVersion, _transaction, _event) {
				const store = db.createObjectStore('fileCacheStore', {
					keyPath: 'mediaId',
					autoIncrement: true
				});
				store.createIndex('byProjectId', 'projectId');
			},
			blocked(_currentVersion, _blockedVersion, _event) {
				// …
			},
			blocking(_currentVersion, _blockedVersion, _event) {
				// …
			},
			terminated() {
				// …
			}
		});
	}

	if (db_connection === null) {
		throw 'Could not connect to indexedDB!';
	}

	return db_connection;
}

export async function getAllMediaForProject(projectId: string): Promise<CachedMedia[]> {
	const result = (await db()).getAllFromIndex('fileCacheStore', 'byProjectId', projectId);
	return result;
}

export async function addMedia(media: CachedMedia): Promise<void> {
	const database = await db();
	database.put('fileCacheStore', media);
}
