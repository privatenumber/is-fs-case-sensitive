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

Check the current working directory's filesystem. Results are cached per-directory.

```ts
import { isFsCaseSensitive } from 'is-fs-case-sensitive'

// Check current working directory (defaults to process.cwd())
// On a standard macOS or Windows system:
console.log(isFsCaseSensitive())
// => false

// On a standard Linux system:
console.log(isFsCaseSensitive())
// => true
```

### Check Specific Directory

Check case-sensitivity of a specific directory's filesystem.

```ts
import { isFsCaseSensitive } from 'is-fs-case-sensitive'

// Check a specific directory
console.log(isFsCaseSensitive('/path/to/directory'))
// => true or false depending on that directory's filesystem

// Different mount points can have different case-sensitivity
console.log(isFsCaseSensitive('/home/user')) // => true (ext4)
console.log(isFsCaseSensitive('/mnt/windows')) // => false (NTFS)
```

### Advanced Usage

You can provide a custom `fs` implementation and bypass the cache for testing purposes.

```ts
import { Volume } from 'memfs'
import { isFsCaseSensitive } from 'is-fs-case-sensitive'

// `memfs` is case-sensitive by default
const customFs = Volume.fromJSON({})

// Pass in directory, custom fs implementation, and disable cache
const isSensitive = isFsCaseSensitive(undefined, customFs, false)

console.log(isSensitive)
// => true
```

## ⚙️ How it Works

The check detects case-sensitivity of a **specific directory's filesystem** using a fast, I/O-free primary method with a reliable fallback.

1.  **Primary Check:** The function inverts the case of the directory path and checks if the inverted-case version resolves to an existing directory. This is fast, requires no write permissions, and doesn't trigger file watchers.
2.  **Fallback Check:** If the primary check is inconclusive (e.g., the path has no letters to invert or the directory doesn't exist), it safely writes and immediately deletes a temporary file in that directory. When checking the default working directory and it's not writable, it falls back to the OS temp directory.
3.  **Caching:** Results are **cached per directory**. Subsequent calls for the same directory return instantly without re-checking.

> [!IMPORTANT]
> Since different mount points can have different case-sensitivity settings, this package checks the filesystem where the specified directory resides. Always pass the directory you care about to get accurate results for that filesystem.

## 🛠️ API

### `isFsCaseSensitive(directoryPath?, fsInstance?, useCache?)`

Returns: `boolean`

Returns `true` if the filesystem is case-sensitive, `false` otherwise.

#### `directoryPath`

Type: `string`
Default: `process.cwd()`

The directory path to check. Different mount points can have different case-sensitivity settings.

When omitted (defaults to current working directory), the function will fall back to checking the OS temp directory if the working directory isn't writable. When explicitly provided, the function will throw an error if the directory isn't accessible or writable.

#### `fsInstance`

Type: `object` with `existsSync`, `writeFileSync`, and `unlinkSync` methods.
Default: Node.js `fs` module.

An optional filesystem implementation to use. This is primarily intended for testing with mock filesystems like `memfs`.

#### `useCache`

Type: `boolean`
Default: `true`

Controls whether the result is cached per directory.
- `true`: The check runs once per directory, and results are cached. Subsequent calls for the same directory return instantly.
- `false`: The cache is bypassed, and the filesystem check is re-run. This is useful for tests where you need to check different mock filesystems.
