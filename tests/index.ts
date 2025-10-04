import type { Stats, PathLike, PathOrFileDescriptor } from 'fs';
import path from 'path';
import { describe, expect } from 'manten';
import { createFixture } from 'fs-fixture';
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

describe('isFsCaseSensitive', ({ describe }) => {
	describe('Mock Filesystem Tests', ({ describe }) => {
		describe('Primary Method (CWD exists)', ({ test }) => {
			test('Case-Sensitive', () => {
				const mockFs = createMockFs({ isCaseSensitive: true });
				mockFs.writeFileSync(process.cwd(), '');
				expect(isFsCaseSensitive(mockFs, false)).toBe(true);
			});

			test('Case-Insensitive', () => {
				const mockFs = createMockFs({ isCaseSensitive: false });
				mockFs.writeFileSync(process.cwd(), '');
				expect(isFsCaseSensitive(mockFs, false)).toBe(false);
			});
		});

		describe('Fallback Method (CWD has no letters)', ({ test }) => {
			test('Case-Sensitive', () => {
				const mockFs = createMockFs({ isCaseSensitive: true });
				// CWD with no letters to invert triggers fallback
				expect(isFsCaseSensitive(mockFs, false)).toBe(true);
				const temporaryFile = path.join(process.cwd(), `.is-fs-case-sensitive-test-${process.pid}`);
				expect(mockFs.existsSync(temporaryFile)).toBe(false);
			});

			test('Case-Insensitive', () => {
				const mockFs = createMockFs({ isCaseSensitive: false });
				// CWD with no letters to invert triggers fallback
				expect(isFsCaseSensitive(mockFs, false)).toBe(false);
				const temporaryFile = path.join(process.cwd(), `.is-fs-case-sensitive-test-${process.pid}`);
				expect(mockFs.existsSync(temporaryFile)).toBe(false);
			});
		});

		describe('Caching', ({ test }) => {
			test('Returns cached result on subsequent calls', () => {
				const sensitiveFs = createMockFs({ isCaseSensitive: true });
				sensitiveFs.writeFileSync(process.cwd(), '');
				expect(isFsCaseSensitive(sensitiveFs, true)).toBe(true);

				const insensitiveFs = createMockFs({ isCaseSensitive: false });
				insensitiveFs.writeFileSync(process.cwd(), '');
				expect(isFsCaseSensitive(insensitiveFs, true)).toBe(true);

				expect(isFsCaseSensitive(insensitiveFs, false)).toBe(false);
			});
		});
	});

	describe('Real Filesystem Tests', ({ test }) => {
		test('Detects actual case-sensitivity in CWD', async () => {
			await using fixture = await createFixture(
				{
					'testfile.txt': 'test content',
				},
				{ tempDir: process.cwd() },
			);

			// Try to access with uppercase name
			const uppercaseExists = await fixture.exists('TESTFILE.TXT');

			// Get detection result for CWD (bypass cache for fresh result)
			const detectedCaseSensitive = isFsCaseSensitive(undefined, false);

			// If case-sensitive: uppercase path should NOT exist
			// If case-insensitive: uppercase path SHOULD exist
			expect(detectedCaseSensitive).toBe(!uppercaseExists);
		});

		test('Detects actual case-sensitivity in temp directory', async () => {
			await using fixture = await createFixture({
				'testfile.txt': 'test content',
			});

			// Try to access with uppercase name
			const uppercaseExists = await fixture.exists('TESTFILE.TXT');

			// Get detection result - use isFsCaseSensitive without cache
			// since CWD might have different case-sensitivity than tmpdir
			const detectedCaseSensitive = isFsCaseSensitive(undefined, false);

			// If case-sensitive: uppercase path should NOT exist
			// If case-insensitive: uppercase path SHOULD exist
			expect(detectedCaseSensitive).toBe(!uppercaseExists);
		});

		test('Returns boolean for any platform', () => {
			const result = isFsCaseSensitive();

			// These are typical defaults, but can be configured differently
			// Linux: usually ext4 (case-sensitive)
			// macOS: usually APFS case-insensitive, but can be case-sensitive
			// Windows: usually NTFS (case-insensitive)

			// Just verify the function returns a boolean
			expect(typeof result).toBe('boolean');
		});
	});
});
