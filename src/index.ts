import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Subset of Node.js fs module methods required for case-sensitivity detection.
 * This allows custom fs implementations to be passed for testing purposes.
 */
type FsSubset = {
	existsSync: typeof fs.existsSync;
	writeFileSync: typeof fs.writeFileSync;
	unlinkSync: typeof fs.unlinkSync;
};

/**
 * Inverts the case of all letters in a string.
 * Uppercase letters become lowercase and vice versa.
 * Non-letter characters remain unchanged.
 *
 * @param string - The string to invert
 * @returns The string with all letter cases inverted
 * @example invertCase('/Users/Name') // => '/uSERS/nAME'
 */
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

/**
 * Checks directory case-sensitivity by writing a temporary file.
 * Creates a file with lowercase name, then checks if its case-inverted path exists.
 * The temporary file is always cleaned up, even if an error occurs.
 *
 * @param directory - The directory path to check
 * @param fsInstance - The filesystem implementation to use
 * @returns `true` if the filesystem is case-sensitive, `false` otherwise
 */
const checkDirectoryCaseWithWrite = (directory: string, fsInstance: FsSubset): boolean => {
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

/**
 * Detects whether the filesystem is case-sensitive.
 *
 * Uses a fast, I/O-free primary method that checks if the specified directory
 * path can be accessed with inverted case. Falls back to writing a temporary
 * file if the primary method is inconclusive.
 *
 * Different mount points can have different case-sensitivity settings, so this
 * function checks the filesystem where the specified directory resides.
 *
 * @param directoryPath - The directory path to check. Defaults to
 * `process.cwd()`. Different mount points can have different case-sensitivity.
 * @param fsInstance - Custom filesystem implementation (primarily for
 * testing). Defaults to Node.js `fs` module.
 * @param useCache - Whether to cache the result per directory. Defaults to
 * `true`. When enabled, subsequent calls for the same directory return
 * instantly without re-checking.
 * @returns `true` if the filesystem is case-sensitive, `false` otherwise
 *
 * @example
 * ```ts
 * import { isFsCaseSensitive } from 'is-fs-case-sensitive'
 *
 * // Check current working directory's filesystem
 * if (isFsCaseSensitive()) {
 *   console.log('Case-sensitive filesystem (likely Linux)')
 * } else {
 *   console.log('Case-insensitive filesystem (likely macOS/Windows)')
 * }
 *
 * // Check specific directory
 * const isHomeCaseSensitive = isFsCaseSensitive('/home/user')
 * ```
 */
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
