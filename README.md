# is-fs-case-sensitive [![Latest version](https://badgen.net/npm/v/is-fs-case-sensitive)](https://npm.im/is-fs-case-sensitive) [![Install size](https://packagephobia.now.sh/badge?p=is-fs-case-sensitive)](https://packagephobia.now.sh/result?p=is-fs-case-sensitive)

Detect whether the file-system has case-sensitive file paths.

## 🙋‍♂️ Why?
File systems can have case-sensitive or case-insensitive file paths:

- [macOS is case-insensitive by default](https://support.apple.com/guide/disk-utility/file-system-formats-dsku19ed921c/mac#dsku127e6e61)
- [Windows is case-insensitive by default](https://learn.microsoft.com/en-us/windows/wsl/case-sensitivity)
- [Linux is case-sensitive](https://stackoverflow.com/a/26300931/911407)

This distinction is important for tools that navigate the file-system (e.g. whether to apply a glob case-sensitively).

## 🚀 Install
```sh
npm install is-fs-case-sensitive
```

## 👨🏻‍🏫 Examples

```ts
import { isFsCaseSensitive } from 'is-fs-case-sensitive'

console.log(isFsCaseSensitive())
// => false
```

## ⚙️ API

### isFsCaseSensitive(fs)

Returns: `boolean`

#### fs
Type: `typeof fs`

Default: `import('fs')`

The file-system to use to check for case-sensitivity.
