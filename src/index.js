import { Intent, Position, Toaster } from "@blueprintjs/core";
import { showColorPopover, destroyPopoverPortal } from "./colorPopover";
import { filterTopLevelBlocks, getBlockContentByUid } from "./roamAPI";
import { createCommands } from "./commands";

const colorTagsRegex = /#c:[a-zA-Z]* |#c:[a-zA-Z]* |#c:[a-zA-Z]* /g;
const colorTagsWithMarkupRegex =
  /#c:[a-zA-Z]* \*\*([^\*]*)\*\*|#c:[a-zA-Z]* \^\^([^\^]*)\^\^|#c:[a-zA-Z]* \_\_([^\_]*)\_\_|#c:[a-zA-Z]* ~~([^~]*)~~/g;
const bgColorRegex = /\#\.bg-(ch-)?[a-zA-Z]*/g;
const boxColorRegex = /\#\.box-(ch-)?[a-zA-Z]*/g;
const blockColorRegex = /\#\.(bg|box)-(ch-)?[a-zA-Z]*/g;

let flag = { h: false, b: false, i: false, x: false };
let needConfirmKey = false;
let lastMultiselect = null; // snapshot of text selection before palette opens
const argListener = {
  capture: true,
  once: true,
};
const colorTagsDefault = [
  "#c:blue",
  "#c:BLUE",
  "#c:fuchsia",
  "#c:FUCHSIA",
  "#c:green",
  "#c:GREEN",
  "#c:orange",
  "#c:ORANGE",
  "#c:silver",
  "#c:SILVER",
  "#c:red",
  "#c:RED",
  "#c:teal",
  "#c:TEAL",
  "#c:yellow",
  "#c:YELLOW",
  "#c:black",
  "#c:BLACK",
];
let colorTags = [];
const colorKeysDefault = [
  "b",
  "B",
  "f",
  "F",
  "g",
  "G",
  "o",
  "O",
  "s",
  "S",
  "r",
  "R",
  "t",
  "T",
  "y",
  "Y",
  "w",
  "W",
];

let colorKeys = [];
let colorLetterList = "";
let cursorAfter, removeOption, keepColor, toastOption;
let toolbarEnabled = true;
let keyboardEnabled = true;
let lastColor = { h: "", b: "", i: "", bg: "", box: "", x: "" };
let confirmKey = "Control";
let alwaysConfirm = false;
let colorApplied = false;
class CursorPosition {
  constructor(elt = document.activeElement) {
    this.elt = elt;
    this.s = elt.selectionStart;
    this.e = elt.selectionEnd;
  }

  setPos(shift = 0) {
    this.elt = document.activeElement;
    this.s = this.elt.selectionStart + shift;
    this.e = this.elt.selectionEnd + shift;
  }
  isEgal(pos) {
    if (this.elt === pos.elt && this.s === pos.s && this.e === pos.e)
      return true;
    else return false;
  }
  hasSelection() {
    if (this.s != this.e) return true;
    else return false;
  }
}
let currentPos = new CursorPosition();
let lastPos = new CursorPosition();

const AppToaster = Toaster.create({
  className: "color-toaster",
  position: Position.TOP,
  maxToasts: 1,
});

function keyHighlight(e) {
  if (flag["h"] || flag["b"] || flag["i"] || flag["x"]) {
    currentPos.setPos();
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key == "b" || e.key == "h" || e.key == "i" || e.key == "y")
    ) {
      if (toastOption) AppToaster.clear();
      flag["b"] = false;
      flag["h"] = false;
      flag["i"] = false;
      flag["x"] = false;
      needConfirmKey = false;
      colorApplied = false;
    }
  }
  if (!flag["h"] && !flag["b"] && !flag["i"] && !flag["x"]) {
    if (isPressed(e, "h")) return;
    else if (isPressed(e, "b")) return;
    else if (isPressed(e, "i")) return;
    else if (isPressedX(e)) return;
    if (e.altKey && e.key == "h") {
      removeHighlightsFromBlock(null, removeOption);
      setCursorPosition(document.activeElement);
    }
  }

  if (flag["h"] && isModifierKeyPressed(e, "h")) return;
  else if (flag["b"] && isModifierKeyPressed(e, "b")) return;
  else if (flag["i"] && isModifierKeyPressed(e, "i")) return;
  else if (flag["x"] && isModifierKeyPressed(e, "x")) return;
}

// Special variant of isPressed for the inline-box (~~) shortcut: Cmd+y triggers flag["x"]
function isPressedX(e) {
  if ((e.ctrlKey || e.metaKey) && e.key == "y") {
    if (keepColor && lastColor["x"] != "") {
      colorApplied = true;
      setTimeout(function () {
        currentPos.setPos();
        addColor(lastColor["x"], "x");
      }, 120);
    }
    flag["x"] = true;
    lastPos.setPos(2);
    if (!alwaysConfirm && lastPos.hasSelection()) {
      needConfirmKey = false;
      if (toastOption) colorToast();
    } else {
      needConfirmKey = true;
      if (toastOption)
        AppToaster.show({
          message: "Press " + confirmKey + " to activate the color choice.",
          intent: Intent.WARNING,
          timeout: 2000,
        });
    }
    return true;
  }
  return false;
}

function isPressed(e, key) {
  if ((e.ctrlKey || e.metaKey) && e.key == key) {
    if (keepColor && lastColor[key] != "") {
      colorApplied = true;
      setTimeout(function () {
        currentPos.setPos();
        addColor(lastColor[key], key);
      }, 120);
    }
    flag[key] = true;
    lastPos.setPos(2);
    if (!alwaysConfirm && lastPos.hasSelection()) {
      needConfirmKey = false;
      if (toastOption) colorToast();
    } else {
      needConfirmKey = true;
      if (toastOption)
        AppToaster.show({
          message: "Press " + confirmKey + " to activate the color choice.",
          intent: Intent.WARNING,
          timeout: 2000,
        });
    }
    return true;
  }
  return false;
}

function isModifierKeyPressed(e, key) {
  if (colorApplied && currentPos.isEgal(lastPos) && e.key == "Backspace") {
    flag[key] = false;
    window.roamAlphaAPI.data.undo();
    if (toastOption) AppToaster.clear();
    lastColor[key] = "";
    e.preventDefault();
    colorApplied = false;
    return true;
  }
  if (!e.shiftKey && !(e.key === confirmKey)) flag[key] = false;
  if (!needConfirmKey) {
    currentPos.setPos();
    if (currentPos.isEgal(lastPos)) {
      let color;
      if (e.key === "Home") {
        color = lastColor[key];
        e.preventDefault();
      } else color = checkColorKeys(e.key);
      if (color != "") {
        flag[key] = false;
        if (keepColor && lastColor[key] != "") {
          window.roamAlphaAPI.data.undo();
          lastColor[key] = color;
        }
        setTimeout(function () {
          currentPos.setPos();
          addColor(color, key);
        }, 40);
        e.preventDefault();
      }
    }
    if (toastOption) AppToaster.clear();
  } else {
    if (e.key === confirmKey) {
      if (toastOption) AppToaster.clear();
      needConfirmKey = false;
      if (toastOption) colorToast();
      e.preventDefault();
    }
  }
  if (colorApplied && e.key == "Backspace") {
    flag[key] = false;
    window.roamAlphaAPI.data.undo();
    lastColor[key] = "";
    e.preventDefault();
  }
  return false;
}

function colorToast(withHome = true, withBackspace = false) {
  let letterList = colorLetterList;
  let homeTxt = "",
    backspaceTxt = "";
  if (!colorApplied && withHome) homeTxt = ", or `Home` for last color";
  if (colorApplied || withBackspace)
    backspaceTxt = ", or `Backspace` to reset to default Roam format";
  AppToaster.show({
    message:
      "Press the first letter of a color (" +
      letterList +
      ")" +
      homeTxt +
      backspaceTxt +
      ".",
    intent: Intent.WARNING,
  });
}

function checkColorKeys(key, backgroundMarkup) {
  for (let i = 0; i < colorKeys.length; i++) {
    if (key == colorKeys[i]) {
      return backgroundMarkup
        ? colorTags[i].replace("#c:", backgroundMarkup)
        : colorTags[i];
    }
  }
  return "";
}

function addColor(color, flag) {
  if (flag == "h") lastColor["h"] = color;
  if (flag == "b") lastColor["b"] = color;
  if (flag == "i") lastColor["i"] = color;
  if (flag == "x") lastColor["x"] = color;
  let tagLength = color.length + 1;
  let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  if (!uid) return;
  let content = getBlockContent(uid);
  content =
    content.slice(0, currentPos.s - 2) +
    color +
    " " +
    content.slice(currentPos.s - 2);
  window.roamAlphaAPI.updateBlock({ block: { uid: uid, string: content } });
  currentPos.setPos();
  setCursorPosition(tagLength);
  //  }
}

function getMarkupInfoFromBlocks(uids) {
  const inlineMarkups = ["^^", "**", "__", "~~"];
  const markupCounts = { "^^": 0, "**": 0, __: 0, "~~": 0 };
  const colorKeysPerMarkup = {
    "^^": new Set(),
    "**": new Set(),
    __: new Set(),
    "~~": new Set(),
  };

  for (const uid of uids) {
    const content = getBlockContent(uid);
    for (const markup of inlineMarkups) {
      if (!content.includes(markup)) continue;
      markupCounts[markup]++;
      const escaped = markup
        .replace(/\^/g, "\\^")
        .replace(/\*/g, "\\*")
        .replace(/_/g, "\\_");
      const re = new RegExp("#c:([a-zA-Z-]*) " + escaped, "g");
      let m;
      while ((m = re.exec(content)) !== null) {
        const colorTag = "#c:" + m[1];
        const idx = colorTags.indexOf(colorTag);
        if (idx !== -1) colorKeysPerMarkup[markup].add(colorKeys[idx]);
      }
    }
  }

  const presentMarkups = inlineMarkups.filter((mu) => markupCounts[mu] > 0);
  const currentColorKeys = {};
  for (const markup of presentMarkups) {
    currentColorKeys[markup] = [...colorKeysPerMarkup[markup]];
  }

  return {
    presentMarkups,
    isSingleMarkupType: presentMarkups.length === 1,
    currentColorKeys,
  };
}

// Used by the color popover: inserts or wraps text with color+markup at a known cursor/selection position.
// selStart/selEnd come from the slash command args.indexes or textarea.selectionStart/End captured before
// the command palette closed. For background markups (#.bg-), delegates to setColorInBlock as before.
function applyColorFromPopover(
  syntheticEvent,
  uid,
  markup,
  selStart,
  selEnd,
  extraMarkup,
  selectedUids,
) {
  const colorTag = checkColorKeys(syntheticEvent.key);
  if (!colorTag && syntheticEvent.key !== "Backspace") return;

  // Bulk mode: multiple blocks selected
  if (selectedUids && selectedUids.length > 0) {
    // For children markup, only apply to top-level blocks
    const uidsToProcess =
      markup === "#.bg-ch-" || markup === "#.box-ch-"
        ? filterTopLevelBlocks(selectedUids)
        : selectedUids;
    if (markup.includes("#")) {
      if (extraMarkup) {
        // Both block-level markups selected: apply both in a single write per block
        uidsToProcess.forEach((blockUid) =>
          applyTwoBlockMarkups(syntheticEvent, blockUid, markup, extraMarkup),
        );
      } else {
        uidsToProcess.forEach((blockUid) =>
          setColorInBlock(syntheticEvent, blockUid, markup),
        );
      }
    } else {
      // Highlight/bold/underline: wrap entire block content if no existing markup,
      // otherwise update existing markup color tags
      const colorTag = checkColorKeys(syntheticEvent.key);
      if (!colorTag && syntheticEvent.key !== "Backspace") return;
      uidsToProcess.forEach((blockUid) => {
        const content = getBlockContent(blockUid);
        const hasMarkup = content.includes(markup);
        if (hasMarkup) {
          // Block already has markup pairs — update their color tags as usual
          setColorInBlock(syntheticEvent, blockUid, markup);
        } else if (syntheticEvent.key !== "Backspace" && colorTag) {
          // No existing markup — wrap the whole block content
          const newContent = colorTag + " " + markup + content + markup;
          setTimeout(() => {
            window.roamAlphaAPI.updateBlock({
              block: { uid: blockUid, string: newContent },
            });
          }, 50);
        }
      });
    }
    return;
  }

  // Background colors: no insertion point needed, delegate to existing logic
  if (markup.includes("#")) {
    if (extraMarkup) {
      applyTwoBlockMarkups(syntheticEvent, uid, markup, extraMarkup);
    } else {
      setColorInBlock(syntheticEvent, uid, markup);
    }
    return;
  }

  if (syntheticEvent.key === "Backspace") {
    setColorInBlock(syntheticEvent, uid, markup);
    return;
  }

  _applyColorFromPopoverWrite(uid, markup, colorTag, selStart, selEnd);
}

// Used by the "Change color of highlights" multiselect command.
// Only updates blocks that already contain the chosen markup — never wraps new content.
function applyColorChangeFromPopover(
  syntheticEvent,
  _uid,
  markup,
  _sel0,
  _sel1,
  _extraMarkup,
  selectedUids,
) {
  if (!selectedUids || selectedUids.length === 0) return;

  if (syntheticEvent.key === "Backspace") {
    selectedUids.forEach((blockUid) => {
      const content = getBlockContent(blockUid);
      const newContent = markup.includes("#")
        ? removeFromContent(content, false, null)
        : removeFromContent(content, false, markup);
      setTimeout(() => {
        window.roamAlphaAPI.updateBlock({
          block: { uid: blockUid, string: newContent },
        });
      }, 50);
    });
    return;
  }

  const uidsToProcess =
    markup === "#.bg-ch-" || markup === "#.box-ch-"
      ? filterTopLevelBlocks(selectedUids)
      : selectedUids;
  uidsToProcess.forEach((blockUid) => {
    const content = getBlockContent(blockUid);
    if (!content.includes(markup)) return;
    setColorInBlock(syntheticEvent, blockUid, markup);
  });
}

async function _applyColorFromPopoverWrite(
  uid,
  markup,
  colorTag,
  selStart,
  selEnd,
) {
  lastColor[getFlagFromMarkup(markup)] = colorTag;

  let content = getBlockContent(uid);
  let insertPos = selStart !== null ? selStart : content.length;

  const hasSelection =
    selStart !== null && selEnd !== null && selStart !== selEnd;
  let newContent, cursorTarget;

  if (hasSelection) {
    // Wrap the selected text: "colorTag ^^selected^^"
    const before = content.slice(0, selStart);
    const selected = content.slice(selStart, selEnd);
    const after = content.slice(selEnd);
    newContent = before + colorTag + " " + markup + selected + markup + after;
    cursorTarget =
      selStart +
      colorTag.length +
      1 +
      markup.length +
      selected.length +
      markup.length;
  } else {
    // No selection: insert "colorTag ^^^^" with cursor placed between the markup pair
    const pos = Math.min(insertPos, content.length);
    newContent =
      content.slice(0, pos) +
      colorTag +
      " " +
      markup +
      markup +
      content.slice(pos);
    cursorTarget = pos + colorTag.length + 1 + markup.length;
  }

  await window.roamAlphaAPI.updateBlock({
    block: { uid: uid, string: newContent },
  });

  // Restore focus and set cursor after Roam re-renders the block
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

function setCursorPosition(length = 0) {
  setTimeout(() => {
    let input = document.activeElement;
    if (currentPos.s == currentPos.e)
      input.selectionStart = input.selectionEnd = currentPos.s + length;
    else {
      if (cursorAfter)
        input.selectionStart = input.selectionEnd = currentPos.e + length + 2;
      else {
        input.selectionStart = currentPos.s + length;
        input.selectionEnd = currentPos.e + length;
      }
    }
    lastPos.setPos();
    currentPos.setPos();
  }, 80);
  return;
}

function removeHighlightsFromBlock(uid = null, removeMarkups = false) {
  if (uid == null)
    uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  if (!uid) return;
  let content = getBlockContent(uid);
  content = removeFromContent(content, removeMarkups);
  setTimeout(function () {
    window.roamAlphaAPI.updateBlock({ block: { uid: uid, string: content } });
  }, 10);
}

function removeFromContent(
  content,
  removeMarkups = false,
  onlyForThisMarkup = null,
) {
  let bgMatches = [];
  let tagMatches;
  if (!onlyForThisMarkup) {
    bgMatches = content.match(blockColorRegex);
    if (bgMatches)
      bgMatches.forEach((match) => (content = content.replaceAll(match, "")));
  }
  if (removeMarkups) {
    tagMatches = [...content.matchAll(colorTagsWithMarkupRegex)];
    if (tagMatches)
      tagMatches.forEach(
        (tag) =>
          (content = content.replaceAll(
            tag[0],
            tag[1] ? tag[1] : tag[2] ? tag[2] : tag[3] ? tag[3] : "",
          )),
      );
  } else {
    tagMatches = [...content.matchAll(colorTagsRegex)].filter((tag) => {
      return onlyForThisMarkup
        ? content.slice(
            tag.index + tag[0].length,
            tag.index + tag[0].length + 2,
          ) === onlyForThisMarkup
        : tag;
    });
    let shift = 0;
    if (tagMatches)
      tagMatches.forEach((tag) => {
        content =
          content.slice(0, tag.index - shift) +
          content.slice(tag.index + tag[0].length - shift);
        shift += tag[0].length;
      });
  }
  return content.trim();
}

function recursiveCleaning(branch) {
  if (!branch) return;
  for (let i = 0; i < branch.length; i++) {
    let nodeUid = branch[i].uid;
    let nodeContent = branch[i].string;
    let newContent = removeFromContent(nodeContent, removeOption);
    if (nodeContent.length != newContent.length) {
      setTimeout(function () {
        window.roamAlphaAPI.updateBlock({
          block: { uid: nodeUid, string: newContent },
        });
      }, 20);
    }
    if (branch[i].children) recursiveCleaning(branch[i].children);
  }
}

function applyTwoBlockMarkups(e, uid, markup1, markup2) {
  const colorTag1 = checkColorKeys(e.key);
  const isRemove = e.key === "Backspace";
  const flag1 = getFlagFromMarkup(markup1);
  const flag2 = getFlagFromMarkup(markup2);

  let content = getBlockContent(uid);

  // Apply markup1
  const regex1 = markup1.startsWith("#.box-") ? boxColorRegex : bgColorRegex;
  const match1 = content.match(regex1);
  const colorTag1str =
    !isRemove && colorTag1 ? markup1 + colorTag1.slice(3) : "";
  content = match1
    ? content.replace(match1[0], colorTag1str)
    : colorTag1str
      ? content + " " + colorTag1str
      : content;
  content = content.trim();
  if (!isRemove && colorTag1) lastColor[flag1] = colorTag1;

  // Apply markup2
  const regex2 = markup2.startsWith("#.box-") ? boxColorRegex : bgColorRegex;
  const match2 = content.match(regex2);
  const colorTag2str =
    !isRemove && colorTag1 ? markup2 + colorTag1.slice(3) : "";
  content = match2
    ? content.replace(match2[0], colorTag2str)
    : colorTag2str
      ? content + " " + colorTag2str
      : content;
  content = content.trim();
  if (!isRemove && colorTag1) lastColor[flag2] = colorTag1;

  setTimeout(function () {
    window.roamAlphaAPI.updateBlock({ block: { uid, string: content } });
  }, 50);
}

function setColorInBlock(e, uid, markup, isLastColorToApply = false) {
  !isLastColorToApply && AppToaster.clear();
  let flag = getFlagFromMarkup(markup);
  if (isLastColorToApply && keepColor && !lastColor[flag]) return;
  if (
    (isLastColorToApply && keepColor && lastColor[flag] != "") ||
    colorKeysDefault.includes(e.key) ||
    e.key == "Backspace"
  ) {
    let color = isLastColorToApply ? lastColor[flag] : checkColorKeys(e.key);
    if (e && e.key == "Backspace") {
      color = "remove";
      e.preventDefault();
    }
    if (color != "") {
      if (color === "remove") color = "";
      else if (e && e.key) lastColor[flag] = color;

      let content = getBlockContent(uid);
      let newContent;
      if (markup.includes("#")) {
        const familyRegex = markup.startsWith("#.box-")
          ? boxColorRegex
          : bgColorRegex;
        let match = content.match(familyRegex);
        let colorTag = color != "" ? markup + color.slice(3) : "";
        match
          ? (newContent = content.replace(match[0], colorTag))
          : (newContent = content + " " + colorTag);
        newContent = newContent.trim();
      } else {
        newContent = removeFromContent(content, false, markup);
        let splitContent = newContent.split(markup);
        for (let i = 0; i < splitContent.length; i += 2) {
          if (i != splitContent.length - 1)
            splitContent[i] = splitContent[i] + color + (color ? " " : "");
        }
        newContent = splitContent.join(markup);
      }
      setTimeout(function () {
        window.roamAlphaAPI.updateBlock({
          block: { uid: uid, string: newContent },
        });
      }, 50);
      e && e.preventDefault();
    }
  }
  if (e && e.shiftKey && e.key === "Shift") {
    document.addEventListener(
      "keydown",
      function (e) {
        setColorInBlock(e, uid, markup);
      },
      argListener,
    );
  }
}

function getFlagFromMarkup(markup) {
  let key;
  switch (markup) {
    case "**":
      key = "b";
      break;
    case "__":
      key = "i";
      break;
    case "#.bg-":
    case "#.bg-ch-":
      key = "bg";
      break;
    case "#.box-":
    case "#.box-ch-":
      key = "box";
      break;
    case "~~":
      key = "x";
      break;
    default:
      key = "h";
  }
  return key;
}

function setColorCallback(uid, markup) {
  colorToast(false, true);
  keepColor && setColorInBlock(null, uid, markup, true);
  document.addEventListener(
    "keydown",
    function (e) {
      setColorInBlock(e, uid, markup);
    },
    argListener,
  );
}

function chooseConfirmKey(key) {
  switch (key) {
    case "Command or Meta":
      confirmKey = "Meta";
      break;
    case "Space":
      confirmKey = " ";
      break;
    case "Control":
    case "Alt":
    case "Insert":
    case "c":
    default:
      confirmKey = key;
  }
}

function getPageViewTreeByBlockUid(bUid) {
  let tree = window.roamAlphaAPI.q(`
    [:find (pull ?pageview 
      [ :block/string :block/uid :block/children
        {:block/children ...}])
          :where [?pageview :block/uid "${bUid}"]]`)[0][0];
  return tree;
}

function getBlockContent(uid) {
  return window.roamAlphaAPI.q(`[:find (pull ?page [:block/string])
                      :where [?page :block/uid "${uid}"]  ]`)[0][0].string;
}

/*==============================================================================================================================*/
/* CONFIG & LOAD settings */

let commands = null;
let snapshotHandler = null;

const panelConfig = {
  tabTitle: "Color Highlighter",
  settings: [
    {
      id: "toolbar-enabled",
      name: "Enable Toolbar",
      description:
        "Enable the color picker popover (slash command, multiselect menu, command palette popover). Disable to hide all toolbar-related UI.",
      action: {
        type: "switch",
        onChange: () => {
          toolbarEnabled = !toolbarEnabled;
          if (toolbarEnabled) commands.registerToolbarCommands();
          else commands.unregisterToolbarCommands();
        },
      },
    },
    {
      id: "keyboard-enabled",
      name: "Enable inline keyboard shortcuts",
      description:
        "Enable Cmd/Ctrl+h/b/i/y keyboard shortcuts for inline color mode.",
      action: {
        type: "switch",
        onChange: () => {
          keyboardEnabled = !keyboardEnabled;
          if (keyboardEnabled) commands.registerKeyboardListener();
          else commands.unregisterKeyboardListener();
        },
      },
    },
    /*       {id:     "color-tags",
        name:   "Color tags",
        description: "Customized list of color tags, separated with a comma",
        action: {type:        "input",
                placeholder: "#c:red, #c:green",
                onChange:    (evt) => { 
                  colorTags = evt.target.value;
                 }}},
        {id:     "color-keys",
         name:   "Color keys",
         description: "Customized list of unique keys to trigger colors, in the same ordre as color tags",
         action: {type:     "input",
                  onChange: (evt) => { 
        //         colorKeys = evt.taget.value;
         }}},*/
    {
      id: "keep-color",
      name: "Keep last color",
      description:
        "Apply automaticaly last color when highlighting or bolding text (backspace to reset)",
      action: {
        type: "switch",
        onChange: (evt) => {
          keepColor = !keepColor;
        },
      },
    },
    {
      id: "confirmKeyOption",
      name: "Trigger color-mode key",
      description:
        "Key to press before choosing a color, and after Cmd-Ctrl + h or + b, if no text is selected",
      action: {
        type: "select",
        items: ["Control", "Alt", "Command or Meta", "Space", "Insert", "c"],
        onChange: (evt) => {
          chooseConfirmKey(evt);
        },
      },
    },
    {
      id: "confirmOption",
      name: "Always need to press trigger color-mode key",
      description:
        "Always ask for confirmation to enable color-mode, with or without selected text",
      action: {
        type: "switch",
        onChange: (evt) => {
          alwaysConfirm = !alwaysConfirm;
        },
      },
    },
    {
      id: "cursor-position",
      name: "Cursor just after highlighted/colored text",
      description:
        "If disabled, text highlighted/colored will be selected (native Roam behavior)",
      action: {
        type: "switch",
        onChange: (evt) => {
          cursorAfter = !cursorAfter;
        },
      },
    },
    {
      id: "remove-option",
      name: "Remove Mardown format characters when removing color tags",
      description:
        "If enable, remove ^^,**,__ when removing tags from block or page view (command palette)",
      action: {
        type: "switch",
        onChange: (evt) => {
          removeOption = !removeOption;
        },
      },
    },
    {
      id: "toast-option",
      name: "Display popup reminder",
      description:
        "Display popup notifications to remind to press a key and the list of colors",
      action: {
        type: "switch",
        onChange: (evt) => {
          toastOption = !toastOption;
        },
      },
    },
  ],
};

export default {
  onload: ({ extensionAPI }) => {
    extensionAPI.settings.panel.create(panelConfig);

    commands = createCommands({
      extensionAPI,
      getLastMultiselect: () => lastMultiselect,
      setLastMultiselect: (v) => { lastMultiselect = v; },
      getRemoveOption: () => removeOption,
      applyColorFromPopover,
      applyColorChangeFromPopover,
      getMarkupInfoFromBlocks,
      removeHighlightsFromBlock,
      getPageViewTreeByBlockUid,
      recursiveCleaning,
      setColorCallback,
      keyHighlight,
    });
    snapshotHandler = commands.registerAlwaysOnCommands();
    //    if (extensionAPI.settings.get("color-tags") == null)
    colorTags = colorTagsDefault;
    colorLetterList = colorTags.join(", ").replaceAll("#c:", "");
    //    else colorTags = extensionAPI.settings.get("color-tags").replace(' ','').split(",");
    //    if (extensionAPI.settings.get("color-keys") == null)
    colorKeys = colorKeysDefault;
    //    else colorTags = extensionAPI.settings.get("color-keys").replace(' ','').split(",");

    if (extensionAPI.settings.get("keep-color") == null) {
      extensionAPI.settings.set("keep-color", false);
      keepColor = false;
    } else keepColor = extensionAPI.settings.get("keep-color");
    if (extensionAPI.settings.get("cursor-position") == null) {
      extensionAPI.settings.set("cursor-position", false);
      cursorAfter = false;
    } else cursorAfter = extensionAPI.settings.get("cursor-position");
    if (extensionAPI.settings.get("remove-option") == null) {
      extensionAPI.settings.set("remove-option", false);
      removeOption = false;
    } else removeOption = extensionAPI.settings.get("remove-option");
    if (extensionAPI.settings.get("toast-option") == null) {
      extensionAPI.settings.set("toast-option", true);
      toastOption = true;
    } else toastOption = extensionAPI.settings.get("toast-option");
    if (extensionAPI.settings.get("confirmKeyOption") == null) {
      extensionAPI.settings.set("confirmKeyOption", confirmKey);
    } else chooseConfirmKey(extensionAPI.settings.get("confirmKeyOption"));
    if (extensionAPI.settings.get("confirmOption") == null) {
      extensionAPI.settings.set("confirmOption", alwaysConfirm);
    } else alwaysConfirm = extensionAPI.settings.get("confirmOption");
    if (extensionAPI.settings.get("toolbar-enabled") == null) {
      extensionAPI.settings.set("toolbar-enabled", true);
      toolbarEnabled = true;
    } else toolbarEnabled = extensionAPI.settings.get("toolbar-enabled");
    if (extensionAPI.settings.get("keyboard-enabled") == null) {
      extensionAPI.settings.set("keyboard-enabled", true);
      keyboardEnabled = true;
    } else keyboardEnabled = extensionAPI.settings.get("keyboard-enabled");

    if (toolbarEnabled) commands.registerToolbarCommands();
    if (keyboardEnabled) commands.registerKeyboardListener();
    flag["h"] = false;
    flag["b"] = false;
    flag["i"] = false;
    flag["x"] = false;

    /* Smartblock command
            const arg = {
            text: '',
            help: "",
            handler: (context) => () => {
            return '';
            },
        }      
        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.registerCommand(arg);        
        } else {
            document.body.addEventListener(
            `roamjs:smartblocks:loaded`,
            () =>
                window.roamjs?.extension.smartblocks &&
                window.roamjs.extension.smartblocks.registerCommand(arg)
            );
        }*/
    console.log("Color Highlighter loaded.");
  },
  onunload: () => {
    commands.unregisterAlwaysOnCommands(snapshotHandler);
    if (toolbarEnabled) commands.unregisterToolbarCommands();
    if (keyboardEnabled) commands.unregisterKeyboardListener();
    destroyPopoverPortal();
    console.log("Color Highlighter unloaded.");
  },
};
