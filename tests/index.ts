import type { Stats, PathLike, PathOrFileDescriptor } from 'fs';
import os from 'os';
import path from 'path';
import { describe, test, expect } from 'manten';
import { isFsCaseSensitive } from '../src/index.js';

// Helper to create a mock fs instance with corrected signatures
const createMockFs = (options: { isCaseSensitive: boolean }) => {
	const files = new Set<string>();
	const getPath = (p: string) => (options.isCaseSensitive ? p : p.toLowerCase());
	return {
		existsSync: (p: PathLike): boolean => files.has(getPath(p.toString())),

		writeFileSync: (p: PathOrFileDescriptor, _data: unknown): void => {
			files.add(getPath(p.toString()));
		},

		unlinkSync: (p: PathLike): void => {
			files.delete(getPath(p.toString()));
		},

		// This is not used by the function but can be useful for other tests
		statSync: () => ({ isFile: () => true }) as Stats,
	};
};

describe('Unit Tests: isFsCaseSensitive', () => {
	test('Primary Method: Case-Sensitive', () => {
		const mockFs = createMockFs({ isCaseSensitive: true });
		mockFs.writeFileSync(process.execPath, '');
		expect(isFsCaseSensitive(mockFs, false)).toBe(true);
	});

	test('Primary Method: Case-Insensitive', () => {
		const mockFs = createMockFs({ isCaseSensitive: false });
		mockFs.writeFileSync(process.execPath, '');
		expect(isFsCaseSensitive(mockFs, false)).toBe(false);
	});

	test('Fallback Method: Case-Sensitive', () => {
		const mockFs = createMockFs({ isCaseSensitive: true });
		expect(isFsCaseSensitive(mockFs, false)).toBe(true);
		const temporaryFile = path.join(os.tmpdir(), `is-fs-case-sensitive-test-${process.pid}`);
		expect(mockFs.existsSync(temporaryFile)).toBe(false);
	});

	test('Fallback Method: Case-Insensitive', () => {
		const mockFs = createMockFs({ isCaseSensitive: false });
		expect(isFsCaseSensitive(mockFs, false)).toBe(false);
		const temporaryFile = path.join(os.tmpdir(), `is-fs-case-sensitive-test-${process.pid}`);
		expect(mockFs.existsSync(temporaryFile)).toBe(false);
	});

	test('Caching mechanism works correctly', () => {
		const sensitiveFs = createMockFs({ isCaseSensitive: true });
		sensitiveFs.writeFileSync(process.execPath, '');
		expect(isFsCaseSensitive(sensitiveFs, true)).toBe(true);

		const insensitiveFs = createMockFs({ isCaseSensitive: false });
		insensitiveFs.writeFileSync(process.execPath, '');
		expect(isFsCaseSensitive(insensitiveFs, true)).toBe(true);

		expect(isFsCaseSensitive(insensitiveFs, false)).toBe(false);
	});
});
