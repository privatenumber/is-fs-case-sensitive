import fs from 'fs';

declare const isFsCaseSensitive: (fsInstance?: typeof fs) => boolean;

export { isFsCaseSensitive };
