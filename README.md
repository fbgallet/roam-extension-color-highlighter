# Color Highlighter

### Highlight, write or underline text with different colors, or change background color of blocks. Keyboard only.

![image](https://user-images.githubusercontent.com/74436347/230618428-7caf405d-8060-4630-a954-a0324979c223.png)

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

⚠️ Light background colors (color name in lower case) are currently not very readable for Roam Studio dark themes, prefer dark colors (in upper case)

### Current default set of colors (_initial letter ⇒ tag_)

- b ⇒ #c:blue (or #.bg-blue or #.bg-ch-blue for background color)
- B ⇒ #c:BLUE
- f ⇒ #c:fuchsia
- F ⇒ #c:FUCHSIA
- g ⇒ #c:green
- G ⇒ #c:GREEN
- o ⇒ #c:orange
- O ⇒ #c:ORANGE
- s ⇒ #c:silver
- S ⇒ #c:SILVER (more grey than silver)
- r ⇒ #c:red
- R ⇒ #c:RED
- t ⇒ #c:teal
- y ⇒ #c:yellow
- w ⇒ #c:black

### Color customization with CSS
In a css block on the roam/css page, you can specify for example:
```
/* Set red highlight example */
[data-tag="c:red"] + .rm-highlight {
  background-color: #FFD6D3 !important;
}
/* Set blue text example */
[data-tag="c:blue"] + .rm-bold {
  color: #84C9FF !important;
}
/* Set blue background color */
.blue > .rm-block__self,
.blue {
background-color: #0074d9;
}
/* you can also use variables eventually defined in the :root of your theme */
[data-tag="c:red"] + .rm-highlight {
  background-color: var(--cl-red-100) !important;
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
