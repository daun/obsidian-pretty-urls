# Obsidian Pretty URLs

**A plugin for [Obsidian](https://obsidian.md) to improve display of URLs**

Remove common prefixes like `https://` and `www.` from links in
[reading view](https://obsidian.md/help/edit-and-read#Reading+view). Useful if you can't be bothered to use markdown links and still want your notes to look
clean. The plugin only affects the display of links – the actual note content remains
unchanged.

## Example

**Before**

> Watch [https://www.youtube.com/watch?v=3C1Gnxhfok0](https://www.youtube.com/watch?v=3C1Gnxhfok0)  
> and read [https://m.wikipedia.org/wiki/Corsica](https://m.wikipedia.org/wiki/Corsica)

**After**

> Watch [youtube.com/watch?v=3C1Gnxhfok0](https://www.youtube.com/watch?v=3C1Gnxhfok0)  
> and read [wikipedia.org/wiki/Corsica](https://m.wikipedia.org/wiki/Corsica)

## Features

- **Strip protocol**: Remove `http://` or `https://`
- **Strip www subdomain**: Remove `www.`
- **Strip mobile subdomain**: Remove `m.` and `mobile.`
- **Strip amp subdomain**: Remove `amp.`
- **Custom labels**: Transform visible text using regex rules

## Installation

1. Open **Settings → Community plugins** in Obsidian.
2. Select **Browse** and search for **Pretty URLs**.
3. Select **Install**, then **Enable**.

## Usage

Open **Settings → Pretty URLs** to configure the plugin:

- **Hide protocol** — `https:` is always stripped.
- **Hide subdomains** — Toggle stripping of `www.`, `mobile.`, etc.
- **Format links in note properties** — Apply formatting in the [properties panel](https://obsidian.md/help/Editing+and+formatting/Properties).
- **Custom labels** — Define regex rules to replace a URL with a custom label.

## Custom labels

You can define regex rules to rewrite URL-only links with a custom label.

Each rule has a **pattern** (a regular expression) and a **replacement** (a string that
may contain `$1`, `$2`, … to reference capture groups). Rules are evaluated in order;
the first match wins.

The plugin ships with three example rules that are disabled by default.

### How matching works

- Patterns are matched against the final pretty URL, e.g. `github.com/user/repo`.
- Patterns are **not** implicitly anchored — use `^` and `$` yourself if needed.
- Matching is always **case-insensitive**.

## License

[MIT](https://opensource.org/licenses/MIT)
