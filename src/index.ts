import fs from 'fs';
import os from 'os';
import path from 'path';

const invertCase = (string: string) => {
	let newString = '';
	for (let i = 0; i < string.length; i += 1) {
		const character = string[i]!;
		const uppercase = character.toUpperCase();
		newString += character === uppercase ? character.toLowerCase() : uppercase;
	}
	return newString;
};

let caseSensitivity: boolean | undefined;

export const isFsCaseSensitive = (
	fsInstance = fs,
): boolean => {
	// Return cached result on subsequent calls
	if (caseSensitivity !== undefined) {
		return caseSensitivity;
	}

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
		if (invertedCheckFile === checkFile) {
			// Fallthrough to the write-based check
		} else {
			caseSensitivity = !fsInstance.existsSync(invertedCheckFile);
			return caseSensitivity;
		}
	}

	/**
	 * Fallback Method: Create a temporary file.
	 * This uses the process ID to create a unique filename, avoiding conflicts.
	 */
	const temporaryFile = path.join(os.tmpdir(), `is-fs-case-sensitive-test-${process.pid}`);
	try {
		fsInstance.writeFileSync(temporaryFile, '');
		caseSensitivity = !fsInstance.existsSync(invertCase(temporaryFile));
	} finally {
		// Ensure the temporary file is always cleaned up
		try {
			fsInstance.unlinkSync(temporaryFile);
		} catch {
			// Ignore errors on cleanup
		}
	}

	return caseSensitivity;
};
