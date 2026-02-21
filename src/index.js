import { Intent, Position, Toaster } from "@blueprintjs/core";

const colorTagsRegex = /#c:[a-zA-Z]* |#c:[a-zA-Z]* |#c:[a-zA-Z]* /g;
const colorTagsWithMarkupRegex =
  /#c:[a-zA-Z]* \*\*([^\*]*)\*\*|#c:[a-zA-Z]* \^\^([^\^]*)\^\^|#c:[a-zA-Z]* \_\_([^\_]*)\_\_/g;
const bgColorRegex = /\#\.bg-(ch-)?[a-zA-Z]*/g;

let flag = { h: false, b: false, i: false };
let needConfirmKey = false;
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
let lastColor = { h: "", b: "", i: "", bg: "" };
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
  if (flag["h"] || flag["b"] || flag["i"]) {
    currentPos.setPos();
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key == "b" || e.key == "h" || e.key == "i")
    ) {
      if (toastOption) AppToaster.clear();
      flag["b"] = false;
      flag["h"] = false;
      flag["i"] = false;
      needConfirmKey = false;
      colorApplied = false;
    }
  }
  if (!flag["h"] && !flag["b"] && !flag["i"]) {
    if (isPressed(e, "h")) return;
    else if (isPressed(e, "b")) return;
    else if (isPressed(e, "i")) return;
    if (e.altKey && e.key == "h") {
      removeHighlightsFromBlock(null, removeOption);
      setCursorPosition(document.activeElement);
    }
  }

  if (flag["h"] && isModifierKeyPressed(e, "h")) return;
  else if (flag["b"] && isModifierKeyPressed(e, "b")) return;
  else if (flag["i"] && isModifierKeyPressed(e, "i")) return;
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
  onlyForThisMarkup = null
) {
  let bgMatches = [];
  let tagMatches;
  if (!onlyForThisMarkup) {
    bgMatches = content.match(bgColorRegex);
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
            tag[1] ? tag[1] : tag[2] ? tag[2] : tag[3] ? tag[3] : ""
          ))
      );
  } else {
    tagMatches = [...content.matchAll(colorTagsRegex)].filter((tag) => {
      return onlyForThisMarkup
        ? content.slice(
            tag.index + tag[0].length,
            tag.index + tag[0].length + 2
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
        let match = content.match(bgColorRegex);
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
      argListener
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
    argListener
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

const panelConfig = {
  tabTitle: "Color Highlighter",
  settings: [
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

// function whiteText() {
//   let styleSheet = document.styleSheets[82];
//   console.log(styleSheet);

//   for (let i = 0; i < styleSheet.cssRules.length; i++) {
//     console.log(styleSheet.cssRules[i].selectorText);
//     if (
//       styleSheet.cssRules[i].selectorText ===
//       '[data-tag="c:BLUE"] + .rm-highlight'
//     ) {
//       styleSheet.cssRules[i].style.color = "black !important";
//     }
//   }
// }

export default {
  onload: ({ extensionAPI }) => {
    extensionAPI.settings.panel.create(panelConfig);
    //setToBlackText();

    // extensionAPI.ui.commandPalette.addCommand({
    //   label: "Color Highlighter: background color",
    //   callback: () => {
    //     let block = window.roamAlphaAPI.ui.getFocusedBlock();
    //     let menu = document.querySelector(".bp3-menu.bp3-text-small");
    //     let separator = document.createElement("li");
    //     separator.classList.add("bp3-menu-divider");
    //     menu.appendChild(separator);
    //    // TODO
    //   },
    // });

    extensionAPI.ui.commandPalette.addCommand({
      label: "Color Highlighter: Remove color tags from current BLOCK",
      callback: () => {
        let block = window.roamAlphaAPI.ui.getFocusedBlock();
        removeHighlightsFromBlock(block["block-uid"], removeOption);
        setTimeout(function () {
          window.roamAlphaAPI.ui.setBlockFocusAndSelection({ location: block });
        }, 250);
      },
    });
    extensionAPI.ui.commandPalette.addCommand({
      label: "Color Highlighter: Remove color tags from current PAGE zoom view",
      callback: async () => {
        try {
          let uid =
            await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
          if (!uid) return;
          const tree = getPageViewTreeByBlockUid(uid);
          if (!tree) return;
          if (typeof tree.string != "undefined")
            removeHighlightsFromBlock(tree.uid, removeOption);
          recursiveCleaning(tree.children);
        } catch (err) {
          console.error("Color Highlighter: failed to clean page view", err);
        }
      },
    });
    extensionAPI.ui.commandPalette.addCommand({
      label:
        "Color Highlighter: Set color of highlights in current block (+letter or Backspace)",
      callback: () => {
        let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        setColorCallback(uid, "^^");
      },
    });
    extensionAPI.ui.commandPalette.addCommand({
      label:
        "Color Highlighter: Set color of bolded texts in current block (+letter or Backspace)",
      callback: () => {
        let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        setColorCallback(uid, "**");
      },
    });
    extensionAPI.ui.commandPalette.addCommand({
      label:
        "Color Highlighter: Set color of underlined texts in current block (+letter or Backspace)",
      callback: () => {
        let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        setColorCallback(uid, "__");
      },
    });
    extensionAPI.ui.commandPalette.addCommand({
      label: "Color Highlighter: Set background color, this block only",
      callback: (e) => {
        let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        setColorCallback(uid, "#.bg-");
      },
    });
    extensionAPI.ui.commandPalette.addCommand({
      label: "Color Highlighter: Set background color, with children",
      callback: (e) => {
        let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        setColorCallback(uid, "#.bg-ch-");
      },
    });

    roamAlphaAPI.ui.blockContextMenu.addCommand({
      label: "Color Highlighter: Remove color tags",
      "display-conditional": (e) => e["block-string"].includes("#c:"),
      callback: (e) => removeHighlightsFromBlock(e["block-uid"], removeOption),
    });
    roamAlphaAPI.ui.blockContextMenu.addCommand({
      label:
        "Color Highlighter: Set color of highlights (& press a letter or Backspace)",
      "display-conditional": (e) => e["block-string"].includes("^^"),
      callback: (e) => setColorCallback(e["block-uid"], "^^"),
    });
    roamAlphaAPI.ui.blockContextMenu.addCommand({
      label:
        "Color Highlighter: Set color of bold texts (& press a letter or Backspace)",
      "display-conditional": (e) => e["block-string"].includes("**"),
      callback: (e) => setColorCallback(e["block-uid"], "**"),
    });
    roamAlphaAPI.ui.blockContextMenu.addCommand({
      label:
        "Color Highlighter: Set color of underlined texts (& press a letter or Backspace)",
      "display-conditional": (e) => e["block-string"].includes("__"),
      callback: (e) => setColorCallback(e["block-uid"], "__"),
    });
    roamAlphaAPI.ui.blockContextMenu.addCommand({
      label: "Color Highlighter: Set background color, this block only",
      callback: (e) => setColorCallback(e["block-uid"], "#.bg-"),
    });
    roamAlphaAPI.ui.blockContextMenu.addCommand({
      label: "Color Highlighter: Set background color, with children",
      callback: (e) => setColorCallback(e["block-uid"], "#.bg-ch-"),
    });
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

    window.addEventListener("keydown", keyHighlight);
    flag["h"] = false;
    flag["b"] = false;
    flag["i"] = false;

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
    roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label: "Color Highlighter: Remove color tags",
    });
    roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label:
        "Color Highlighter: Set color of highlights (& press a letter or Backspace)",
    });
    roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label:
        "Color Highlighter: Set color of bold texts (& press a letter or Backspace)",
    });
    roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label:
        "Color Highlighter: Set color of underlined texts (& press a letter or Backspace)",
    });
    roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label: "Color Highlighter: Set background color, this block only",
    });
    roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label: "Color Highlighter: Set background color, with children",
    });
    window.removeEventListener("keydown", keyHighlight);
    console.log("Color Highlighter unloaded.");
  },
};
