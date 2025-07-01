class OPFSManager {
	private static instance: OPFSManager;
	private rootDirectory: FileSystemDirectoryHandle | null = null;
	private fileHandleCache = new Map<string, FileSystemFileHandle>();
	private directoryHandleCache = new Map<string, FileSystemDirectoryHandle>();

	private constructor() {}

	public static getInstance(): OPFSManager {
		if (!OPFSManager.instance) {
			OPFSManager.instance = new OPFSManager();
		}
		return OPFSManager.instance;
	}

	public async getRootDirectory(): Promise<FileSystemDirectoryHandle> {
		if (!this.rootDirectory) {
			this.rootDirectory = await navigator.storage.getDirectory();
		}
		return this.rootDirectory;
	}

	public async getFileHandle(
		path: string,
		options?: FileSystemGetFileOptions
	): Promise<FileSystemFileHandle> {
		const cacheKey = `${path}:${JSON.stringify(options || {})}`;

		if (this.fileHandleCache.has(cacheKey)) {
			return this.fileHandleCache.get(cacheKey)!;
		}

		const rootDir = await this.getRootDirectory();
		const fileHandle = await rootDir.getFileHandle(path, options);
		this.fileHandleCache.set(cacheKey, fileHandle);

		return fileHandle;
	}

	public async getDirectoryHandle(
		path: string,
		options?: FileSystemGetDirectoryOptions
	): Promise<FileSystemDirectoryHandle> {
		const cacheKey = `${path}:${JSON.stringify(options || {})}`;

		if (this.directoryHandleCache.has(cacheKey)) {
			return this.directoryHandleCache.get(cacheKey)!;
		}

		const rootDir = await this.getRootDirectory();
		const dirHandle = await rootDir.getDirectoryHandle(path, options);
		this.directoryHandleCache.set(cacheKey, dirHandle);

		return dirHandle;
	}

	public clearCache(): void {
		this.fileHandleCache.clear();
		this.directoryHandleCache.clear();
	}

	public removeCachedFileHandle(path: string, options?: FileSystemGetFileOptions): void {
		const cacheKey = `${path}:${JSON.stringify(options || {})}`;
		this.fileHandleCache.delete(cacheKey);
	}

	public removeCachedDirectoryHandle(path: string, options?: FileSystemGetDirectoryOptions): void {
		const cacheKey = `${path}:${JSON.stringify(options || {})}`;
		this.directoryHandleCache.delete(cacheKey);
	}
}

export const opfsManager = OPFSManager.getInstance();
