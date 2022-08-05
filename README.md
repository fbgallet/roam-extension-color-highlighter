# roam-extension-color-highlighter

### Highlight text with different colors or write text with different colors. Keyboard only.

![Color highlighter](https://user-images.githubusercontent.com/74436347/182986774-2ea89bf0-e125-4da8-9f0d-4ca287968aea.png)

## Instructions
Select some part of your text, add Highight with native Roam hotkeys (Ctrl-Cmd + h), then press a letter corresponding to the first letter of the color, e.g. 'g' for Green. If you press Shift + a letter, the color will be more vivid. It will insert a tag like `#c:green` before highlight or bold markup, and the cursor will be positionned just after the colored text (or as selection of the colored text, in option).

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

Settings allow you to use your own set of color tags and corresponding trigger letters. If you enter something in the setting fields, only your tags will be available. If you remove your settings, default tags will be applied.

This extension is currently keyboard only, I could add some visual UI in the future and more customization.

## Bonus
Two commands in the Command Palette (Ctrl-Cmd + p) to remove all colors tags of the current block or, in addition, all format markups (^^, \*\*, \_\_)

_Credit to @CatoMinor3 for the great CSS trick allowing to customize highlighted and bold texts in Roam!_
