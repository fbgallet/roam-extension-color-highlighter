import { Intent, Position, Toaster } from "@blueprintjs/core";

var hFlag = false,
  tFlag = false,
  needConfirmKey = false;
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
  "#c:yellow",
  "#c:black",
];
var colorTags = [];
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
  "y",
  "w",
];

var colorKeys = [];
var cursorAfter, removeOption, keepColor, toastOption;
var lastColorH = "";
var lastColorT = "";
var lastToaster = "";
var confirmKey = "Control";
var alwaysConfirm = false;
var colorApplied = false;
var position = function (elt = document.activeElement) {
  this.elt = elt;
  this.s = elt.selectionStart;
  this.e = elt.selectionEnd;

  this.setPos = function (shift = 0) {
    this.elt = document.activeElement;
    this.s = this.elt.selectionStart + shift;
    this.e = this.elt.selectionEnd + shift;
  };
  this.isEgal = function (pos) {
    if (this.elt === pos.elt && this.s === pos.s && this.e === pos.e)
      return true;
    else return false;
  };
  this.hasSelection = function () {
    if (this.s != this.e) return true;
    else return false;
  };
};
var currentPos = new position();
var lastPos = new position();

const AppToaster = Toaster.create({
  className: "recipe-toaster",
  position: Position.TOP,
  maxToasts: 1,
});

function keyHighlight(e) {
  if (hFlag || tFlag) {
    currentPos.setPos();
    if ((e.ctrlKey || e.metaKey) && (e.key == "b" || e.key == "h")) {
      if (toastOption) AppToaster.clear();
      tFlag = false;
      hFlag = false;
      needConfirmKey = false;
    }
  }
  if (!hFlag && !tFlag) {
    if ((e.ctrlKey || e.metaKey) && e.key == "h") {
      if (keepColor && lastColorH != "") {
        colorApplied = true;
        setTimeout(function () {
          currentPos.setPos();
          addColor(lastColorH, "h");
        }, 120);
      }
      hFlag = true;
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
      //      lastPos.setPos(2);
      return;
    } else if ((e.ctrlKey || e.metaKey) && e.key == "b") {
      if (keepColor && lastColorT != "") {
        colorApplied = true;
        setTimeout(function () {
          currentPos.setPos();
          addColor(lastColorT, "t");
        }, 120);
      }
      tFlag = true;
      if (!alwaysConfirm && hasSelection()) {
        if (toastOption) colorToast();
        needConfirmKey = false;
      } else {
        needConfirmKey = true;
        if (toastOption)
          lastToaster = AppToaster.show({
            message: "Press " + confirmKey + " to activate the color choice.",
            intent: Intent.WARNING,
            timeout: 2000,
          });
      }
      lastPos.setPos(2);
      return;
    }
    if (e.altKey && e.key == "h") {
      removeHighlightsFromBlock(null, removeOption);
      setCursorPosition(document.activeElement);
    }
  }

  if (hFlag) {
    if (colorApplied && currentPos.isEgal(lastPos) && e.key == "Backspace") {
      hFlag = false;
      window.roamAlphaAPI.data.undo();
      if (toastOption) AppToaster.clear();
      lastColorH = "";
      e.preventDefault();
      colorApplied = false;
      return;
    }
    if (!e.shiftKey && !(e.key === confirmKey)) hFlag = false;
    if (!needConfirmKey) {
      currentPos.setPos();
      if (currentPos.isEgal(lastPos)) {
        let color;
        if (e.key === "Home") {
          color = lastColorH;
          e.preventDefault();
        } else color = checkColorKeys(e.key);
        if (color != "") {
          hFlag = false;
          if (keepColor && lastColorH != "") {
            window.roamAlphaAPI.data.undo();
            lastColorH = color;
          }
          setTimeout(function () {
            currentPos.setPos();
            addColor(color, "h");
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
  } else if (tFlag) {
    if (colorApplied && currentPos.isEgal(lastPos) && e.key == "Backspace") {
      tFlag = false;
      window.roamAlphaAPI.data.undo();
      if (toastOption) AppToaster.clear();
      lastColorT = "";
      e.preventDefault();
      colorApplied = false;
      return;
    }
    if (!e.shiftKey && !(e.key === confirmKey)) tFlag = false;
    if (!needConfirmKey) {
      currentPos.setPos();
      if (currentPos.isEgal(lastPos)) {
        let color;
        if (e.key === "Home") {
          color = lastColorT;
          e.preventDefault();
        } else color = checkColorKeys(e.key);
        if (color != "") {
          tFlag = false;
          if (keepColor && lastColorT != "") {
            window.roamAlphaAPI.data.undo();
            lastColorT = color;
          }
          setTimeout(function () {
            currentPos.setPos();
            addColor(color, "t");
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
      tFlag = false;
      window.roamAlphaAPI.data.undo();
      lastColorT = "";
      e.preventDefault();
    }
  }
}

function colorToast(withHome = true, withBackspace = false) {
  let letterList = colorTags.join(", ").replaceAll("#c:", "");
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
    intent: Intent.PRIMARY,
  });
}

function checkColorKeys(key) {
  for (let i = 0; i < colorKeys.length; i++) {
    if (key == colorKeys[i]) return colorTags[i];
  }
  return "";
}

function addColor(color, flag) {
  if (flag == "h") lastColorH = color;
  if (flag == "t") lastColorT = color;
  let tagLength = color.length + 1;
  let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
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
  let content = getBlockContent(uid);
  content = removeFromContent(content, removeMarkups);
  setTimeout(function () {
    window.roamAlphaAPI.updateBlock({ block: { uid: uid, string: content } });
  }, 10);
}

function removeFromContent(
  content,
  removeMarkups = false,
  onlyForThisMarkup = ""
) {
  for (let i = 0; i < colorTags.length; i++) {
    content = content.replaceAll(
      colorTags[i] + " " + onlyForThisMarkup,
      "" + onlyForThisMarkup
    );
  }
  if (removeMarkups) {
    content = content.replaceAll("^^", "");
    content = content.replaceAll("**", "");
    content = content.replaceAll("__", "");
  }
  return content;
}

function recursiveCleaning(branch) {
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

function setColorInBlock(e, uid, markup) {
  AppToaster.clear();
  let color = checkColorKeys(e.key);
  if (e.key == "Backspace") {
    color = "remove";
    e.preventDefault();
  }
  if (color != "") {
    if (color == "remove") color = "";
    let content = getBlockContent(uid);
    let newContent = removeFromContent(content, false, markup);
    let splitContent = newContent.split(markup);
    for (let i = 0; i < splitContent.length; i += 2) {
      if (i != splitContent.length - 1)
        splitContent[i] = splitContent[i] + color + " ";
    }
    newContent = splitContent.join(markup);
    setTimeout(function () {
      window.roamAlphaAPI.updateBlock({
        block: { uid: uid, string: newContent },
      });
    }, 50);
    e.preventDefault();
  }
}

function setColorCallback(uid, markup) {
  colorToast(false, true);
  const argListener = {
    capture: true,
    once: true,
  };
  addEventListener(
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
      name: "Remove Mardown format charactere when removing color tags",
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
    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: "Color Highlighter: Remove color tags from current BLOCK",
      callback: () => {
        let block = window.roamAlphaAPI.ui.getFocusedBlock();
        removeHighlightsFromBlock(block["block-uid"], removeOption);
        setTimeout(function () {
          window.roamAlphaAPI.ui.setBlockFocusAndSelection({ location: block });
        }, 250);
      },
    });
    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: "Color Highlighter: Remove color tags from current PAGE zoom view",
      callback: async () => {
        let uid =
          await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
        const tree = getPageViewTreeByBlockUid(uid);
        if (typeof tree.string != "undefined")
          removeHighlightsFromBlock(tree.uid, removeOption);
        recursiveCleaning(tree.children);
      },
    });
    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label:
        "Color Highlighter: Set color of highlights in current block (+letter or Backspace)",
      callback: () => {
        let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        setColorCallback(uid, "^^");
      },
    });
    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label:
        "Color Highlighter: Set color of bolded texts in current block (+letter or Backspace)",
      callback: () => {
        let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        setColorCallback(uid, "**");
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
    //    if (extensionAPI.settings.get("color-tags") == null)
    colorTags = colorTagsDefault;
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
    } else confirmKey = extensionAPI.settings.get("confirmKeyOption");
    if (extensionAPI.settings.get("confirmOption") == null) {
      extensionAPI.settings.set("confirmOption", alwaysConfirm);
    } else alwaysConfirm = extensionAPI.settings.get("confirmOption");

    window.addEventListener("keydown", keyHighlight);
    hFlag = false;
    tFlag = false;

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
    window.roamAlphaAPI.ui.commandPalette.removeCommand({
      label: "Color Highlighter: Remove color tags from current BLOCK",
    });
    window.roamAlphaAPI.ui.commandPalette.removeCommand({
      label: "Color Highlighter: Remove color tags from current PAGE zoom view",
    });
    window.roamAlphaAPI.ui.commandPalette.removeCommand({
      label:
        "Color Highlighter: Set color of highlights in current block (+letter or Backspace)",
    });
    window.roamAlphaAPI.ui.commandPalette.removeCommand({
      label:
        "Color Highlighter: Set color of bolded texts in current block (+letter or Backspace)",
    });
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

    window.removeEventListener("keydown", keyHighlight);
    console.log("Color Highlighter unloaded.");
  },
};
