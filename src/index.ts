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

export const isFsCaseSensitive = (
	// Use the more precise FsSubset type for the parameter
	fsInstance: FsSubset = fs,
	useCache: boolean = true,
): boolean => {
	// Return cached result on subsequent calls
	if (useCache && cache !== undefined) {
		return cache;
	}

	let result: boolean;

	/**
	 * Primary Method: Check an existing, known file path.
	 * We use `process.execPath` because it's guaranteed to exist and
	 * avoids needing any filesystem write permissions.
	 */
	const checkFile = process.execPath;
	if (checkFile && fsInstance.existsSync(checkFile)) {
		const invertedCheckFile = invertCase(checkFile);

		// If the inverted-case path is the same as the original,
		// it means there were no characters to invert, so we must use the fallback.
		if (invertedCheckFile !== checkFile) {
			result = !fsInstance.existsSync(invertedCheckFile);
			if (useCache) {
				cache = result;
			}
			return result;
		}
	}

	/**
	 * Fallback Method: Create a temporary file.
	 * This uses the process ID to create a unique filename, avoiding conflicts.
	 */
	const temporaryFile = path.join(os.tmpdir(), `is-fs-case-sensitive-test-${process.pid}`);
	try {
		fsInstance.writeFileSync(temporaryFile, '');
		result = !fsInstance.existsSync(invertCase(temporaryFile));
	} finally {
		// Ensure the temporary file is always cleaned up
		try {
			fsInstance.unlinkSync(temporaryFile);
		} catch {
			// Ignore errors on cleanup
		}
	}

	if (useCache) {
		cache = result;
	}
	return result;
};
