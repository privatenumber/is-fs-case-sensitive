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

let cache: boolean | undefined;

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

export const isFsCaseSensitive = (
	fsInstance: FsSubset = fs,
	useCache: boolean = true,
): boolean => {
	if (useCache && cache !== undefined) {
		return cache;
	}

	let result: boolean;

	/**
	 * Primary Method: Check the CWD path
	 * This is fast, I/O-free, and avoids triggering file watchers.
	 */
	const cwd = process.cwd();
	const invertedCwd = invertCase(cwd);

	if (invertedCwd !== cwd && fsInstance.existsSync(cwd)) {
		result = !fsInstance.existsSync(invertedCwd);
	} else {
		/**
		 * Fallback Method: Write a temp file
		 * This is for the rare case where the CWD has no letters to invert.
		 * We write to CWD to check the actual working directory's filesystem,
		 * but fallback to os.tmpdir() if CWD is not writable.
		 */
		try {
			result = checkDirectoryCaseWithWrite(cwd, fsInstance);
		} catch {
			// CWD not accessible or writable, fallback to temp dir
			result = checkDirectoryCaseWithWrite(os.tmpdir(), fsInstance);
		}
	}

	if (useCache) {
		cache = result;
	}
	return result;
};
