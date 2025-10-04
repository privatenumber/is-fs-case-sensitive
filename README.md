# is-fs-case-sensitive [![Latest version](https://badgen.net/npm/v/is-fs-case-sensitive)](https://npm.im/is-fs-case-sensitive) [![Install size](https://packagephobia.now.sh/badge?p=is-fs-case-sensitive)](https://packagephobia.now.sh/result?p=is-fs-case-sensitive)

Detect whether the underlying filesystem has case-sensitive file paths. A robust, zero-dependency utility for cross-platform tools.

## 🤔 Why?

Different operating systems handle filename casing differently:

- **macOS (APFS):** Case-insensitive by default, but can be formatted as case-sensitive.
- **Windows (NTFS):** Case-insensitive by default, but case-sensitivity can be enabled per-directory.
- **Linux (ext4):** Case-sensitive by default.

This distinction is critical for tools like bundlers, linters, or test runners that need to resolve file paths consistently across different environments. This package provides a reliable, runtime check to determine the actual behavior of the filesystem where your code is running.

## 🚀 Install

```sh
npm install is-fs-case-sensitive
````

## 👨🏻‍🏫 Examples

### Basic Usage

The function is memoized, so subsequent calls are instantaneous.

```ts
import { isFsCaseSensitive } from 'is-fs-case-sensitive'

// On a standard macOS or Windows system:
console.log(isFsCaseSensitive())
// => false

// On a standard Linux system:
console.log(isFsCaseSensitive())
// => true
```

### Advanced Usage

You can provide a custom `fs` implementation and bypass the cache for testing purposes.

```ts
import { Volume } from 'memfs'
import { isFsCaseSensitive } from 'is-fs-case-sensitive'

// `memfs` is case-sensitive by default
const customFs = Volume.fromJSON({})

// Pass in the custom fs implementation and disable the cache
const isSensitive = isFsCaseSensitive(customFs, false)

console.log(isSensitive)
// => true
```

## ⚙️ How it Works

The check detects case-sensitivity of the **working directory's filesystem** using a fast, I/O-free primary method with a reliable fallback.

1.  **Primary Check:** The function checks `process.cwd()` (the current working directory path). It inverts the case of the path and checks if the inverted-case version resolves to an existing directory. This is fast, requires no write permissions, and doesn't trigger file watchers.
2.  **Fallback Check:** If the primary check is inconclusive (e.g., the path has no letters to invert or the directory doesn't exist), it safely writes and immediately deletes a temporary file. It tries to write in the working directory first, but falls back to the OS temp directory if the working directory isn't writable.
3.  **Caching:** The result is **cached** after the first successful check. All subsequent calls to the function within the same process will return the cached result instantly, without performing another check.

> [!IMPORTANT]
> Since different mount points can have different case-sensitivity settings, this package checks the filesystem where your working directory resides, not where the Node.js binary or temp directory is located.

## 🛠️ API

### `isFsCaseSensitive(fsInstance?, useCache?)`

Returns: `boolean`

Returns `true` if the filesystem is case-sensitive, `false` otherwise.

#### `fsInstance`

Type: `object` with `existsSync`, `writeFileSync`, and `unlinkSync` methods.

Default: Node.js `fs` module.

An optional filesystem implementation to use. This is primarily intended for testing with mock filesystems like `memfs`.

#### `useCache`

Type: `boolean`

Default: `true`

Controls whether the result is cached.
- `true`: The check runs once, and the result is memoized for all subsequent calls.
- `false`: The cache is bypassed, and the filesystem check is re-run. This is useful for tests where you need to check different mock filesystems.
