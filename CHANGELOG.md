### v.6 (January 3rd, 2023)

Updated:

- "Keep last color" option is also applied to block background color now

Fixed:

- better support of dark themes with card tags

### v.5 (October 31th, 2023)

New features:

- Card Grid with `#.card-grid` and `#.card-grid-color` tags
- all colors are defined in a CSS variable, customizable in CSS: `--cl-lh-color` for light colors, `--cl-dk-color` for dark colors

Fixed:

- entire compatibility with the dark themes of Roam Studio extension
- colors are now more consistent between highlight/text/underline/block background

### v.4 (March 31th, 2023)

New features:

- Underline colors with native italic command, Ctrl-Cmd + i
- change background color of block or block+children

Fixed: colors work now better with Roam Studio themes (but not light background colors)

### v.3 (August 26th, 2022)

Fixed: colored text (with bold command) was broken, it works now properly!

### v.2 (August 22th, 2022)

New features:

- Get last color with 'Home' key
- Option to change key to confirm color-more
- Option to always ask confirmation before enabling color-mode

Fixes:

- better alignment, small modifications of the css
- pressing twice Ctrl+h or Ctrl+b was not removing format markups but creating a color
- some odd behaviors, unexpectedly occurring color tags,
- bug with backspace
