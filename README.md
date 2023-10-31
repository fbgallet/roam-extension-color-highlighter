# Color Highlighter

### Highlight, write or underline text with different colors, or change background color of blocks. Keyboard only. 🆕 Colored children cards.

![color highlighter screenshot](https://github.com/fbgallet/roam-extension-color-highlighter/assets/74436347/98cbe563-0e19-46bd-ab07-794fdd31fa23)

## Instructions

### Set color of formated text (bold for text color and italic for underline color)
Select some part of your text inside a block, add Highight or bold or set to italic with native Roam hotkeys (`Ctrl or Cmd + h` for highlight, `Ctrl or Cmd + b` for bold, `Ctrl or Cmd + i` for underline), then **press a letter corresponding to the first letter of the color (**without pressing Ctrl-Cmd anymore**)**, e.g. 'g' for green. If you press `Shift` when pressing the color first letter, the color will be more vivid and the text color in the highlight will be white instead of black.

The extension will insert a tag like `#c:green` (or #c:GREEN) before highlight or bold markdown syntax, the result will be e.g.: `#c:green **my green text**`. Of course, these tags are only visible when you edit the block. _Credit to @CatoMinor3 for the great CSS trick allowing to customize highlighted and bold texts in Roam!_

After a color choice, the **cursor** will be placed just next the colored text, right next the markdown characters to be exact, so you can write something else after. In option (panel settings above), you can choose to keep Roam's default behavior: highlighted or bolded text will be selected.

⚠️ If no text is initialy selected (you want to write something new in bold or highlight mode), the cursor will be placed inside the markups, so you can immediatly write. But since the color trigger letters could conflict with the first letter you might write, **you need to enable "color-mode" by pressing again "Ctrl/Cmd" in this case**. Then, you can choose the color. In option, you can force to ask for this confirmation to enter in color-mode, if you notice that you get some color unintentionally. You can also change the key to be pressed to confirm the change to the color-mode. 'Control' key is set by default, but it can cause some confusion with the usual use of the control key for highlighting or bolding. Choose another key if you find that you are triggering colors unintentionally

### Reapply last color
By default, you must choose a color each time, but by pressing `Home` key, you get the last applied color, and if you enable `Keep last color` option, the last applied color will be automaticaly applied when pressing `Ctrl/Cmd + b/h` next times. When tag color has just been inserted, you can change it by pressing the corresponding color letter or reset to default bold/highlight by pression `Backspace`.

### Set background color
Place the cursor in a block and run `Set background color, this block only` or `Set background color, with children`, depending on whether you want to apply the background color to a single block or to it and all its (curent or future) children. You can also run this commands from the block context menu > Plugins. It will add a hidden tag at the end of the block, e.g.: `#bg-red` for one block, `#bg-ch-red` for the block and its children. You can easily change the color with the same command.

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


## Commands (command palette (Crtl/Cmd + p) and block context menu)

- `Remove color tags from current block` (`Atl + h` do the same) (__Command palette & context menu__)
- `Remove all color tags from current page view` (__Command palette__) : it remove all color tags in  the current zoom view, not the whole page, but collapsed bullets are included.
In the setting panel, you can choose if you prefer to remove only tags (default) or tags and format markdown syntax (`^^`, `**`, `__`)
These commands can help to export more easily you data, since colors tags are readable only in Roam with the current extension.

- `Set color of highlights in current block` (__Command palette & context menu__) : once you run the command, **you have to press the first letter of the color**, or Backspace to reset to native highlights (simple `^^`).
- `Set color of bold texts in current block`
- `Set color of underlined texts in current block`

## Change log
  [See versions changelog here](https://github.com/fbgallet/roam-extension-color-highlighter/edit/main/CHANGELOG.md)

## Future developments

- This extension is currently keyboard only, I could add some visual UI.
- Colored borders ?
- Better colors customization.

---

For any question or suggestion, DM me on Twitter: [@fbgallet](https://twitter.com/fbgallet) or Roam Slack.
