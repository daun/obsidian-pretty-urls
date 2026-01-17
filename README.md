# Obsidian Pretty URLs

**A plugin for [Obsidian](https://obsidian.md) to improve display of URLs**

Remove common prefixes like `https://` and `www.` from links in
[reading view](https://help.obsidian.md/edit-and-read#Reading+view).

Useful if you can't be bothered to use markdown links and still want your notes to look
clean. The plugin only affects the display of links – the actual note content remains
unchanged.

## Example

**Before**

> Watch [https://www.youtube.com/watch?v=3C1Gnxhfok0](https://www.youtube.com/watch?v=3C1Gnxhfok0)  
> and read [https://m.wikipedia.org/wiki/Enshittification](https://m.wikipedia.org/wiki/Enshittification)

**After**

> Watch [youtube.com/watch?v=3C1Gnxhfok0](https://www.youtube.com/watch?v=3C1Gnxhfok0)  
> and read [wikipedia.org/wiki/Enshittification](https://m.wikipedia.org/wiki/Enshittification)

## Features

- **Strip protocol**: Remove `http://` or `https://`
- **Strip www subdomain**: Remove `www.`
- **Strip mobile subdomain**: Remove `m.` and `mobile.`
- **Strip amp subdomain**: Remove `amp.`

## License

[MIT](https://opensource.org/licenses/MIT)
