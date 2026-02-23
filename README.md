# Color Highlighter

**Highlight, write or underline text with different colors, change background or add a border box to blocks. Visual toolbar + full keyboard support.**

### 🆕 New in v.7

- New Toolbar (still entirely keyboard only if you prefer)
- Instant edit any existing format/color by opening toolbar with right-click
- Bulk processing of multi-selected blocks

[See versions changelog here](https://github.com/fbgallet/roam-extension-color-highlighter/edit/main/CHANGELOG.md)

### The new toolbar:

![color highlighter screenshot](https://github.com/fbgallet/roam-extension-color-highlighter/assets/74436347/98cbe563-0e19-46bd-ab07-794fdd31fa23)

## Instructions

### Toolbar

Open the toolbar with the hotkey `Ctrl+Alt+h` (customizable in settings), the `/color` slash command, or right-click on a block. The toolbar lets you pick a format (highlight, bold/text, underline, background, inline box, block box) and a color. It works on the cursor position, a text selection, or a multiselect of blocks.

Inside the toolbar, everything can be done keyboard-only: press `1`–`6` to select a format, then a color letter (`b f g o r s t y w`) for the light variant or `Shift`+letter for the dark/vivid variant. Press `Enter` to re-apply the last used color.

### Set color of formatted text (highlight, bold, underline) via native Roam hotkeys

Select some text inside a block, apply native Roam formatting (`Ctrl/Cmd+h` for highlight, `Ctrl/Cmd+b` for bold, `Ctrl/Cmd+i` for underline), then **release Ctrl/Cmd and type the color letter**, e.g. `g` for green. `Shift`+letter gives the dark/vivid variant.

The extension inserts a tag like `#c:green` before the markdown syntax, e.g.: `#c:green **my green text**`. Tags are only visible when editing the block. _Credit to @CatoMinor3 for the CSS trick!_

⚠️ If no text is selected (write mode), the color trigger letters could conflict with what you want to type. **Press `Ctrl/Cmd` again first** to enter color-mode, then type the color letter. In settings, you can force this confirmation for all cases, or change which key triggers color-mode.

### Edit or remove a color

**Right-click on any colored element** in Roam (highlighted text, bold, block with background) to open the edit toolbar and change its color or format. You can also press the toolbar hotkey when the cursor is inside a colored tag to edit it directly.

To remove colors, use `Remove color tags` from the command palette (`Ctrl/Cmd+p`) or the block context menu. `Remove all color tags from current page view` strips the entire visible page.

### Reapply last color

Press `Enter` in the toolbar, or `Home` key after applying native formatting, to reapply the last used color. Enable `Keep last color` in settings to apply it automatically on every `Ctrl/Cmd+b/h`.

### Set background color

Use the toolbar (background format) or the block context menu. Adds a hidden tag at the end of the block: `#bg-red` for one block only, `#bg-ch-red` for the block and all its children. Re-open the toolbar on the block to change it.

### Inline box & block-level box (border)

Two new formats available in the toolbar:

- **Inline box** — wraps selected text in a colored border box, inline in the text
- **Block box** — adds a colored border around the whole block (and optionally its children)

### Card Grid 🆕

Transfor children blocks in a card-like grid (currently with a predefide minimum size of 300px). Just insert a tag in the parent block: `#.card-grid` for the basic display, `#.card-grid-light` or `#.card-grid-dark` to fit to your light/dark theme, or `#.card-grid-color` (e.g.: `#.card-grid-blue`) for colored cards (with the title in the same color).

### Current default set of colors (_initial letter ⇒ tag_)

- b ⇒ #c:blue = `#cee9ff` (or #.bg-blue or #.bg-ch-blue for background color)
- B ⇒ #c:BLUE = `#0254a0`
- f ⇒ #c:fuchsia = `#ffa0ea`
- F ⇒ #c:FUCHSIA = `#f012be`
- g ⇒ #c:green = `#d3f8d5`
- G ⇒ #c:GREEN = `#439946`
- o ⇒ #c:orange = `#ffecd0`
- O ⇒ #c:ORANGE = `#ff851b`
- s ⇒ #c:silver = `#dddddd`
- S ⇒ #c:SILVER = `#aaaaaa` (more grey than silver, but S letter is more convenient)
- r ⇒ #c:red = `#fcb8b8`
- R ⇒ #c:RED = `#e51000`
- t ⇒ #c:teal = `#39cccc`
- T => #c:Teal = `#008080`
- y ⇒ #c:yellow = `#ffdc00` (it's dark yellow, light yellow is: `#fff6b9`)
- w ⇒ #c:black

### Color customization with CSS

In a css block on the roam/css page, you can redefine each color in the `:root { }` with the following syntax: `--cl-lh-color = #xxxxxx` for light colors, `--cl-dk-color: #xxxxxx`. For example, to redefine blue dark color:

```
:root {
  --cl-dk-blue: #2196F3;
}
```

Don't overuse colors ! Don't forget that the extension inserts tags in your content, which reduces its portability (see below the commands to quickly remove tags).

## Commands (command palette (`Ctrl/Cmd+p`) and block context menu)

- `Remove color tags from current block` — also available via `Alt+h` (**Command palette & context menu**)
- `Remove all color tags from current page view` (**Command palette**) — removes all color tags in the current zoom view (collapsed bullets included). In settings, choose whether to remove only tags (default) or tags and format markdown syntax (`^^`, `**`, `__`). Useful before exporting, since color tags only render with this extension.
- `Change color of highlights / bold / underlined texts in current block` (**Command palette & context menu**) — press the first letter of the new color, or `Backspace` to reset to plain formatting.

### Bulk processing (multiselect)

Select multiple blocks with `Shift+click` or `Shift+↑/↓`, then use the toolbar hotkey `Ctrl+Alt+h` or right-click to open the block context menu. All color, change-color, and remove-color commands apply to the entire selection at once.

## If you want to support my work

If you want to encourage me to develop further and enhance Live AI extension, you can [buy me a coffee ☕ here](https://buymeacoffee.com/fbgallet) or [sponsor me on Github](https://github.com/sponsors/fbgallet). Thanks in advance for your support! 🙏

For any question or suggestion, DM me on **X/Twitter** and follow me to be informed of updates and new extensions : [@fbgallet](https://x.com/fbgallet), or on Bluesky: [@fbgallet.bsky.social](https://bsky.app/profile/fbgallet.bsky.social)

Please report any issue [here](https://github.com/fbgallet/roam-extension-live-ai-assistant/issues).
