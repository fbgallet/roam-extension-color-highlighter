import { getBlockContentByUid } from "./roamAPI";

let colorTags = [];
let colorKeys = [];
let checkColorKeysFn = null;

export function initEditMode(tags, keys, checkColorKeys) {
  colorTags = tags;
  colorKeys = keys;
  checkColorKeysFn = checkColorKeys;
}

function findColorKeyForTag(colorTag) {
  const idx = colorTags.indexOf(colorTag);
  if (idx !== -1) return colorKeys[idx];
  const lower = colorTag.toLowerCase();
  for (let i = 0; i < colorTags.length; i++) {
    if (colorTags[i].toLowerCase() === lower) return colorKeys[i];
  }
  return null;
}

export function detectWrapperAtCursor(uid, cursorPos) {
  if (cursorPos === null || cursorPos === undefined) return { found: false };
  const content = getBlockContentByUid(uid);
  if (!content) return { found: false };

  const inlineMarkups = ["^^", "**", "__", "~~"];

  // 1. Check colored inline wrappers: #c:COLOR MARKUP...MARKUP
  for (const markup of inlineMarkups) {
    const escaped = markup.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`#c:([a-zA-Z]+) ${escaped}([^]*?)${escaped}`, "g");
    let m;
    while ((m = re.exec(content)) !== null) {
      const wrapperStart = m.index;
      const wrapperEnd = m.index + m[0].length;
      if (cursorPos >= wrapperStart && cursorPos <= wrapperEnd) {
        const colorName = m[1];
        const colorTag = "#c:" + colorName;
        const colorKey = findColorKeyForTag(colorTag);
        const innerText = m[2];
        const innerStart =
          wrapperStart + ("#c:" + colorName + " ").length + markup.length;
        const innerEnd = innerStart + innerText.length;
        return {
          found: true,
          colorTag,
          colorKey,
          markup,
          wrapperStart,
          wrapperEnd,
          innerStart,
          innerEnd,
          innerText,
        };
      }
    }
  }

  // 2. Check native format wrappers without color: MARKUP...MARKUP (no #c: prefix)
  for (const markup of inlineMarkups) {
    const escaped = markup.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match MARKUP...MARKUP that is NOT preceded by "#c:WORD "
    const re = new RegExp(`${escaped}([^]*?)${escaped}`, "g");
    let m;
    while ((m = re.exec(content)) !== null) {
      const wrapperStart = m.index;
      const wrapperEnd = m.index + m[0].length;
      // Skip if this is part of a colored wrapper (preceded by #c:WORD )
      const before = content.slice(0, wrapperStart);
      if (/#c:[a-zA-Z]+ $/.test(before)) continue;
      if (cursorPos >= wrapperStart && cursorPos <= wrapperEnd) {
        const innerText = m[1];
        const innerStart = wrapperStart + markup.length;
        const innerEnd = innerStart + innerText.length;
        return {
          found: true,
          colorTag: null,
          colorKey: null,
          markup,
          wrapperStart,
          wrapperEnd,
          innerStart,
          innerEnd,
          innerText,
        };
      }
    }
  }

  // 3. Check block-level tags: #.bg-COLOR, #.box-COLOR, #.bg-ch-COLOR, #.box-ch-COLOR
  const blockRe = /#\.(bg|box)-(ch-)?([a-zA-Z]+)/g;
  let m;
  while ((m = blockRe.exec(content)) !== null) {
    const tagStart = m.index;
    const tagEnd = m.index + m[0].length;
    if (cursorPos >= tagStart && cursorPos <= tagEnd) {
      const type = m[1];
      const ch = m[2] || "";
      const colorName = m[3];
      const markup = "#." + type + "-" + ch;
      const colorTag = "#c:" + colorName;
      const colorKey = findColorKeyForTag(colorTag);
      return {
        found: true,
        colorTag,
        colorKey,
        markup,
        wrapperStart: tagStart,
        wrapperEnd: tagEnd,
      };
    }
  }

  return { found: false };
}

export function detectBlockStyleFromDOM(blockUid, styledEl) {
  if (!styledEl || !blockUid) return { found: false };
  const content = getBlockContentByUid(blockUid);
  if (!content) return { found: false };

  // Find the block-level class like "bg-blue", "bg-ch-teal", "box-RED"
  const className = [...styledEl.classList].find((c) =>
    /^(bg|box)-(ch-)?[a-zA-Z]+$/.test(c),
  );
  if (!className) return { found: false };

  // Parse the class: "bg-ch-teal" → type="bg", ch="ch-", colorName="teal"
  const classMatch = className.match(/^(bg|box)-(ch-)?([a-zA-Z]+)$/);
  if (!classMatch) return { found: false };

  const type = classMatch[1];
  const ch = classMatch[2] || "";
  const colorName = classMatch[3];
  const markup = "#." + type + "-" + ch;
  const tag = "#." + type + "-" + ch + colorName; // e.g. "#.bg-ch-teal"

  // Find this tag in the block string
  const tagIndex = content.indexOf(tag);
  if (tagIndex === -1) return { found: false };

  const colorTag = "#c:" + colorName;
  const colorKey = findColorKeyForTag(colorTag);

  return {
    found: true,
    colorTag,
    colorKey,
    markup,
    wrapperStart: tagIndex,
    wrapperEnd: tagIndex + tag.length,
  };
}

export function detectWrapperFromDOM(blockUid, element) {
  if (!element || !blockUid) return { found: false };
  const content = getBlockContentByUid(blockUid);
  if (!content) return { found: false };

  // Check the element itself for a styled class/tag
  let markup = null;
  if (element.classList) {
    if (element.classList.contains("rm-highlight")) markup = "^^";
    else if (element.classList.contains("rm-bold")) markup = "**";
    else if (element.classList.contains("rm-strikethrough")) markup = "~~";
  }
  if (!markup && element.tagName === "EM") markup = "__";
  if (!markup) return { found: false };

  const textContent = element.textContent;
  if (!textContent) return { found: false };

  const escaped = markup.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 1. Try colored wrapper: #c:COLOR MARKUP...text...MARKUP
  const colorRe = new RegExp(
    `#c:([a-zA-Z]+) ${escaped}([^]*?)${escaped}`,
    "g",
  );
  let match;
  while ((match = colorRe.exec(content)) !== null) {
    const innerText = match[2];
    if (innerText === textContent) {
      const colorName = match[1];
      const colorTag = "#c:" + colorName;
      const colorKey = findColorKeyForTag(colorTag);
      const wrapperStart = match.index;
      const wrapperEnd = match.index + match[0].length;
      const innerStart =
        wrapperStart + ("#c:" + colorName + " ").length + markup.length;
      const innerEnd = innerStart + innerText.length;
      return {
        found: true,
        colorTag,
        colorKey,
        markup,
        wrapperStart,
        wrapperEnd,
        innerStart,
        innerEnd,
        innerText,
      };
    }
  }

  // 2. Try native format wrapper: MARKUP...text...MARKUP (no color)
  const plainRe = new RegExp(`${escaped}([^]*?)${escaped}`, "g");
  while ((match = plainRe.exec(content)) !== null) {
    const innerText = match[1];
    // Skip if preceded by #c:WORD
    const before = content.slice(0, match.index);
    if (/#c:[a-zA-Z]+ $/.test(before)) continue;
    if (innerText === textContent) {
      const wrapperStart = match.index;
      const wrapperEnd = match.index + match[0].length;
      const innerStart = wrapperStart + markup.length;
      const innerEnd = innerStart + innerText.length;
      return {
        found: true,
        colorTag: null,
        colorKey: null,
        markup,
        wrapperStart,
        wrapperEnd,
        innerStart,
        innerEnd,
        innerText,
      };
    }
  }

  return { found: false };
}

export function applyColorEditFromPopover(
  syntheticEvent,
  uid,
  newMarkup,
  _selStart,
  _selEnd,
  _extraMarkup,
  _selectedUids,
  editInfo,
) {
  if (!editInfo || !checkColorKeysFn) return;
  const content = getBlockContentByUid(uid);
  if (!content) return;

  const colorTag = checkColorKeysFn(syntheticEvent.key);
  const isBackspace = syntheticEvent.key === "Backspace";
  const isInline = !editInfo.markup.startsWith("#.");
  const hasColor = editInfo.colorTag !== null;

  const isSameColor =
    !isBackspace && colorTag && hasColor && colorTag === editInfo.colorTag;
  const isSameFormat = newMarkup === editInfo.markup;

  let newContent, cursorTarget;

  if (isInline) {
    if (isBackspace || isSameColor) {
      // Remove the entire wrapper, keep inner text
      newContent =
        content.slice(0, editInfo.wrapperStart) +
        editInfo.innerText +
        content.slice(editInfo.wrapperEnd);
      cursorTarget = editInfo.wrapperStart + editInfo.innerText.length;
    } else if (!hasColor && isSameFormat) {
      // Native format without color: add color to existing format
      if (!colorTag) return;
      newContent =
        content.slice(0, editInfo.wrapperStart) +
        colorTag +
        " " +
        content.slice(editInfo.wrapperStart);
      cursorTarget = editInfo.wrapperEnd + colorTag.length + 1;
    } else if (!isSameFormat) {
      // Different format: replace markup delimiters, preserve or change color
      const newColorTag = colorTag || editInfo.colorTag;
      let replacement;
      if (newColorTag) {
        replacement =
          newColorTag + " " + newMarkup + editInfo.innerText + newMarkup;
      } else {
        // No color and no new color picked: just change the format markup
        replacement = newMarkup + editInfo.innerText + newMarkup;
      }
      newContent =
        content.slice(0, editInfo.wrapperStart) +
        replacement +
        content.slice(editInfo.wrapperEnd);
      cursorTarget = editInfo.wrapperStart + replacement.length;
    } else {
      // Same format, different color: replace or add color tag
      if (!colorTag) return;
      if (hasColor) {
        const oldColorTag = editInfo.colorTag;
        const colorStart = editInfo.wrapperStart;
        const colorEnd = colorStart + oldColorTag.length;
        newContent =
          content.slice(0, colorStart) + colorTag + content.slice(colorEnd);
        cursorTarget =
          editInfo.wrapperEnd + (colorTag.length - oldColorTag.length);
      } else {
        // No existing color: insert color tag before the markup
        newContent =
          content.slice(0, editInfo.wrapperStart) +
          colorTag +
          " " +
          content.slice(editInfo.wrapperStart);
        cursorTarget = editInfo.wrapperEnd + colorTag.length + 1;
      }
    }
  } else {
    // Block-level tag
    if (isBackspace || isSameColor) {
      let removeStart = editInfo.wrapperStart;
      if (removeStart > 0 && content[removeStart - 1] === " ") removeStart--;
      newContent =
        content.slice(0, removeStart) + content.slice(editInfo.wrapperEnd);
      newContent = newContent.trim();
      cursorTarget = Math.min(removeStart, newContent.length);
    } else if (!isSameFormat) {
      // Different block format: replace the markup prefix
      if (!colorTag) return;
      const colorName = colorTag.slice(3);
      const newTag = newMarkup + colorName;
      newContent =
        content.slice(0, editInfo.wrapperStart) +
        newTag +
        content.slice(editInfo.wrapperEnd);
      cursorTarget = editInfo.wrapperStart + newTag.length;
    } else {
      // Same format, different color
      if (!colorTag) return;
      const colorName = colorTag.slice(3);
      const newTag = editInfo.markup + colorName;
      newContent =
        content.slice(0, editInfo.wrapperStart) +
        newTag +
        content.slice(editInfo.wrapperEnd);
      cursorTarget = editInfo.wrapperStart + newTag.length;
    }
  }

  window.roamAlphaAPI.updateBlock({
    block: { uid: uid, string: newContent },
  });

  // When triggered from the context menu (right-click), the block was not in
  // edit mode before — don't force focus/cursor into it.
  if (!editInfo.fromContextMenu) {
    setTimeout(() => {
      const focusedBlock = window.roamAlphaAPI.ui.getFocusedBlock();
      if (!focusedBlock) {
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: { "block-uid": uid, "window-id": "main-window" },
          selection: { start: cursorTarget },
        });
      } else {
        const input = document.activeElement;
        if (input && input.tagName === "TEXTAREA") {
          input.selectionStart = input.selectionEnd = cursorTarget;
        }
      }
    }, 100);
  }
}
