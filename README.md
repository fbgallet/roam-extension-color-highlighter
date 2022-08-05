# roam-extension-color-highlighter

### Highlight text or write text with different colors. Keyboard only.

![image](https://user-images.githubusercontent.com/74436347/182989132-886f244e-a37b-40fa-8010-04bdee184e16.png)

## Instructions

Select some part of your text inside a block, add Highight with native Roam hotkeys (`Ctrl + h` on Windows, `Cmd + h` on iOS), then **press a letter corresponding to the first letter of the color (**without pressing Ctrl-Cmd anymore**)**, e.g. 'g' for green. If you press `Shift` when pressing the color first letter, the color will be more vivid and the text color in the highlight will be white instead of black.

The extension will insert a tag like `#c:green` (or #c:GREEN) before highlight or bold markdown syntax, the result will be e.g.: `#c:green**my green text**`. Of course, these tags are only visible when you edit the block. _Credit to @CatoMinor3 for the great CSS trick allowing to customize highlighted and bold texts in Roam!_

By default, you must choose a color each time, but you enable `Keep last color` option, the last applied color will be automaticaly applied when pressing `Ctrl/Cmd + b/h` next times. When tag color has just been inserted, you can change it by pressing the corresponding color letter or reset to default bold/highlight by pression `Backspace`.

After a color choice, the **cursor** will be placed just next the colored text, right next the markdown characters to be exact, so you can write something else after. In option (panel settings above), you can choose to keep Roam's default behavior: highlighted or bolded text will be selected.

⚠️ If no text is initialy selected (you want to write something new in bold or highlight mode), the cursor will be placed inside the markups, so you can immediatly write. But since the color trigger letters could conflict with the first letter you might write, **you need to enable "color mode" by pressing again "Ctrl/Cmd" in this case**. Then, you can choose the color.

Current default set of colors (_initial letter ⇒ tag_)

- b ⇒ #c:blue
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

Don't overuse colors ! Don't forget that the extension inserts tags in your content, which reduces its portability (see below the commands to quickly remove tags).

## Bonus commands

There is two commands in the Command Palette (Ctrl-Cmd + p) for removing colors tags (it can help to export more easily you data, since colors tags are readable only in Roam with the current extension):

- Remove color tags from current block (`Atl + h` do the same)
- Remove all color tags from current page view (current zoom, not the whole page, but collapsed bullets included)
  In the setting panel, you can choose if you prefer to remove only tags (default) or tags and format Markdown syntax (^^, \*\*, \_\_)

## Future developments

- This extension is currently keyboard only, I could add some visual UI.
- Color whole block and/or its children.
- Colored underlining, colored borders.
- Better colors customization.

---

For any question or suggestion, DM me on Twitter: [@fbgallet](https://twitter.com/fbgallet) or Roam Slack.
