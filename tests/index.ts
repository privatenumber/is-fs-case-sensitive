import fs from 'fs';
import { Volume } from 'memfs';
import { describe, expect } from 'manten';
import { isFsCaseSensitive } from '#is-fs-case-sensitive';

describe('is-fs-case-sensitive', ({ test }) => {
	test('builtin fs', async () => {
		const isCaseSensitive = await isFsCaseSensitive();
		const { platform } = process;

		if (platform === 'win32' || platform === 'darwin') {
			expect(isCaseSensitive).toBe(false);
		} else if (platform === 'linux') {
			expect(isCaseSensitive).toBe(true);
		} else {
			throw new Error(`Unknown platform: ${platform}`);
		}
	});

	test('custom fs', async () => {
		const customFs = Volume.fromJSON({});

		const isCaseSensitive = await isFsCaseSensitive(customFs as unknown as typeof fs);
		expect(isCaseSensitive).toBe(true);
	});
});
