import fs from 'fs';
import os from 'os';
import path from 'path';

// Define a type that includes only the fs methods we use
type FsSubset = {
	existsSync: typeof fs.existsSync;
	writeFileSync: typeof fs.writeFileSync;
	unlinkSync: typeof fs.unlinkSync;
};

const invertCase = (string: string): string => {
	let newString = '';
	for (let i = 0; i < string.length; i += 1) {
		const character = string[i]!;
		const uppercase = character.toUpperCase();
		newString += character === uppercase ? character.toLowerCase() : uppercase;
	}
	return newString;
};

const cache = new Map<string, boolean>();

const checkDirectoryCaseWithWrite = (
	directory: string,
	fsInstance: FsSubset,
): boolean => {
	const temporaryFile = path.join(directory, `.is-fs-case-sensitive-test-${process.pid}`);
	try {
		fsInstance.writeFileSync(temporaryFile, '');
		return !fsInstance.existsSync(invertCase(temporaryFile));
	} finally {
		// Ensure the temporary file is always cleaned up
		try {
			fsInstance.unlinkSync(temporaryFile);
		} catch {
			// Ignore errors on cleanup
		}
	}
};

const checkDirectoryCaseWithFallback = (
	targetDirectory: string,
	directoryPath: string | undefined,
	fsInstance: FsSubset,
): boolean => {
	try {
		return checkDirectoryCaseWithWrite(targetDirectory, fsInstance);
	} catch (error) {
		// Only fallback to tmpdir if no explicit directory was provided
		if (directoryPath === undefined) {
			return checkDirectoryCaseWithWrite(os.tmpdir(), fsInstance);
		}
		throw error;
	}
};

export const isFsCaseSensitive = (
	directoryPath?: string,
	fsInstance: FsSubset = fs,
	useCache: boolean = true,
): boolean => {
	const targetDirectory = directoryPath ?? process.cwd();

	// Check cache for this specific directory
	if (useCache && cache.has(targetDirectory)) {
		return cache.get(targetDirectory)!;
	}

	let result: boolean;

	/**
	 * Primary Method: Check the directory path
	 * This is fast, I/O-free, and avoids triggering file watchers.
	 */
	const invertedPath = invertCase(targetDirectory);

	if (invertedPath !== targetDirectory && fsInstance.existsSync(targetDirectory)) {
		result = !fsInstance.existsSync(invertedPath);
	} else {
		/**
		 * Fallback Method: Write a temp file
		 * This is for the rare case where the directory path has no letters to invert.
		 * If no directory was explicitly provided (defaults to CWD), fallback to os.tmpdir() on error.
		 * If user explicitly provided a directory, let the error throw.
		 */
		result = checkDirectoryCaseWithFallback(targetDirectory, directoryPath, fsInstance);
	}

	if (useCache) {
		cache.set(targetDirectory, result);
	}
	return result;
};
