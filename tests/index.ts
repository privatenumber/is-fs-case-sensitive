import type fs from 'fs';
import { Volume } from 'memfs';
import { describe, expect } from 'manten';
import { isFsCaseSensitive } from '#is-fs-case-sensitive';

describe('is-fs-case-sensitive', ({ test }) => {
	test('builtin fs', () => {
		const isCaseSensitive = isFsCaseSensitive();
		const { platform } = process;

		if (platform === 'win32' || platform === 'darwin') {
			expect(isCaseSensitive).toBe(false);
		} else if (platform === 'linux') {
			expect(isCaseSensitive).toBe(true);
		} else {
			throw new Error(`Unknown platform: ${platform}`);
		}
	});

	test('custom fs', () => {
		const customFs = Volume.fromJSON({});

		const isCaseSensitive = isFsCaseSensitive(customFs as unknown as typeof fs);
		expect(isCaseSensitive).toBe(true);
	});
});
