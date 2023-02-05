import fs from 'fs';

const invertCase = (string: string) => {
	let newString = '';

	for (let i = 0; i < string.length; i += 1) {
		const character = string[i];
		const uppercase = character.toUpperCase();
		newString += (
			character === uppercase
				? character.toLowerCase()
				: uppercase
		);
	}

	return newString;
};

const UPPER = 65;
const LOWER = 97;
const getRandomLetter = () => Math.floor(Math.random() * 26);
const getRandomWord = (length: number) => Array.from(
	{ length },
	() => String.fromCodePoint(
		getRandomLetter()
		+ (Math.random() > 0.5 ? UPPER : LOWER),
	),
).join('');

export const isFsCaseSensitive = (
	fsInstance = fs,
) => {
	/**
	 * Check Node.js path if it exists
	 *
	 * Originally used the current file name, but it's more complicated
	 * because you have to use __filename or import.meta.url depending
	 * on the context, and the actual file name is user-defined and hence
	 * can be case-insensitive (e.g. _)
	 */
	const checkFile = process.execPath;
	if (fsInstance.existsSync(checkFile)) {
		return !fsInstance.existsSync(invertCase(checkFile));
	}

	// Generate random file and see if it exists
	const fileName = `/${getRandomWord(10)}`;
	fsInstance.writeFileSync(fileName, '');
	const isCaseSensitive = !fsInstance.existsSync(invertCase(fileName));
	fsInstance.unlinkSync(fileName);

	return isCaseSensitive;
};
