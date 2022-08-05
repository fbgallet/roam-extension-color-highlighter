var hFlag, tFlag, needConfirmKey;
const colorTagsDefault = ["#c:blue", "#c:BLUE", 
                        "#c:fuchsia", "#c:FUCHSIA",
                        "#c:green", "#c:GREEN",
                        "#c:orange", "#c:ORANGE",
                        "#c:silver", "#c:SILVER",
                        "#c:red", "#c:RED",
                        "#c:teal", "#c:yellow", "#c:black"];
var colorTags = [];
const colorKeysDefault = ["b", "B", "f", "F", "g", "G", "o", "O",
                          "s", "S", "r", "R", "t", "y", "w"];
var colorKeys = [];
var cursorAfter, removeOption, keepColor;
var lastColorH = '';
var lastColorT = '';

function keyHighlight(e) {
  if (hFlag) {
    if (!e.shiftKey && !e.ctrlKey) hFlag = false;
    if (!needConfirmKey) {
      let color = checkColorKeys(e.key);
      if (color!='') {
        if (keepColor && lastColorH != '') {
          window.roamAlphaAPI.data.undo();
          lastColorH = color;
        }
        setTimeout(function() {addColor(color, 'h');},50);
        e.preventDefault();
      }
    }
    if (e.ctrlKey) needConfirmKey=false;
    if (e.key == 'Backspace') {
      hFlag = false;
      window.roamAlphaAPI.data.undo();
      lastColorH = '';
      e.preventDefault();
    }
  }
  if (tFlag) {
    if (!e.shiftKey && !e.ctrlKey) tFlag = false;
    if (!needConfirmKey) {
      let color = checkColorKeys(e.key);
      if (color!='') {
        if (keepColor && lastColorT != '') {
          window.roamAlphaAPI.data.undo();
          lastColorT = color;
        }
        setTimeout(function() {addColor(color, 't');},50);
        e.preventDefault();
      }
    }
    if (e.ctrlKey) needConfirmKey=false;
    if (e.key == 'Backspace') {
      tFlag = false;
      window.roamAlphaAPI.data.undo();
      lastColorT = '';
      e.preventDefault();
    }
  }
  if (tFlag !=true && hFlag!=true) {
    if (e.ctrlKey && e.key == "h") {
      if (keepColor && lastColorH!='') {
        setTimeout(function() {addColor(lastColorH, 'h');},100);
      }
      hFlag = true;
      if (hasSelection()) needConfirmKey=false;
      else needConfirmKey=true;
      return;
    }
    if (e.ctrlKey && e.key == "b") {
      if (keepColor && lastColorT!='') {
        setTimeout(function() {addColor(lastColorT, 't');},100); 
      }
      tFlag = true;
      if (hasSelection()) needConfirmKey=false;
      else needConfirmKey=true;
    }
    if ((e.altKey && e.key == "h")) {
      //hFlag = true;
      removeHighlightsFromBlock(null,removeOption);
      setCursorPosition(document.activeElement)
    }
  }
}

function hasSelection() {
  let input = document.activeElement;
  if (input.selectionStart!=input.selectionEnd) return true;
  else return false;
}

function checkColorKeys(key) {
    for(let i=0;i<colorKeys.length;i++) {
        if (key==colorKeys[i]) return colorTags[i];
    }
    return '';
}

function addColor(color, flag) {
    if (keepColor) {
      if (flag=='h' && lastColorH=='') lastColorH=color;
      if (flag=='t' && lastColorT=='') lastColorT=color;
    }
    let tagLength=color.length;
    let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    let content = getBlockContent(uid);
    let input = document.activeElement; 
    let start = input.selectionStart;
    let end = input.selectionEnd;
    content = content.slice(0, start-2) + color + content.slice(start-2);
    window.roamAlphaAPI
            .updateBlock({'block': 
                {'uid': uid,
                'string': content}});
    setCursorPosition(document.activeElement,start,end,tagLength);
}

function setCursorPosition(input,start=0,end=0,length=0) {
  setTimeout(() => {
        input = document.activeElement;
        if (start==end) input.selectionStart = input.selectionEnd = start+length;
        else {
          if (cursorAfter) input.selectionStart = input.selectionEnd = end+length+2;
          else {
              input.selectionStart = start+length;
              input.selectionEnd = end+length;
          }
        }
      },40);
  return;
}

function removeHighlightsFromBlock(uid=null, removeMarkups=false) {
  if (uid==null) uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  let content = getBlockContent(uid);  
  content = removeFromContent(content, removeMarkups);
  setTimeout(function() {
    window.roamAlphaAPI
              .updateBlock({'block': 
                  {'uid': uid,
                  'string': content}});
  },10)
}

function removeFromContent(content, removeMarkups=false) {
  if (removeMarkups) {
    content = content.replaceAll("^^","");
    content = content.replaceAll("**","");
    content = content.replaceAll("__","");
  }
  for(let i=0;i<colorTags.length;i++) {
    content = content.replaceAll(colorTags[i],"");  
  }
  return content;
}

function recursiveCleaning(branch) {
  for (let i=0;i<branch.length;i++) {
    let nodeUid = branch[i].uid; 
    let nodeContent = branch[i].string;
    let newContent = removeFromContent(nodeContent,removeOption);
    if (nodeContent.length != newContent.length) {
      console.log(nodeContent);
      setTimeout(function() {
        window.roamAlphaAPI
                  .updateBlock({'block': 
                      {'uid': nodeUid,
                      'string': newContent}})
      }, 20);
    }
    if (branch[i].children) recursiveCleaning(branch[i].children);
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
    return window.roamAlphaAPI
                 .q(`[:find (pull ?page [:block/string])
                      :where [?page :block/uid "${uid}"]  ]`
                    )[0][0].string;
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
         {id:         "keep-color",
         name:        "Keep last color",
         description: "Apply automaticaly last color when highlighting or bolding text (backspace to reset)",
         action:      {type:     "switch",
                       onChange: (evt) => { 
                         keepColor = !keepColor;
                       }}},
        {id:          "cursor-position",
        name:        "Cursor just after highlighted/colored text",
        description: "If disabled, text highlighted/colored will be selected (native Roam behavior)",
        action:      {type:     "switch",
                      onChange: (evt) => { 
                        cursorAfter = !cursorAfter;
                      }}},
        {id:          "remove-option",
        name:        "Remove Mardown format charactere when removing color tags",
        description: "If enable, remove ^^,**,__ when removing tags from block or page view (command palette)",
        action:      {type:     "switch",
                      onChange: (evt) => { 
                        removeOption = !removeOption;
                      }}},
    ]
  }; 

export default {
    onload:  ({extensionAPI}) => {
        extensionAPI.settings.panel.create(panelConfig);
        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Remove color tags from current block (Color Highlighter extension)",
            callback: async () => {
                let block = window.roamAlphaAPI.ui.getFocusedBlock();              
                removeHighlightsFromBlock(block["block-uid"], removeOption);
                setTimeout(function(){window.roamAlphaAPI.ui.setBlockFocusAndSelection({location: block})},250);
            }
        })
        window.roamAlphaAPI.ui.commandPalette.addCommand({
          label: "Remove all color tags from current page zoom view (Color Highlighter extension)",
          callback: async () => {        
            let uid = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();             
            console.log(uid);
            const tree = getPageViewTreeByBlockUid(uid);
            console.log(tree);
            if (typeof(tree.string) != 'undefined') removeHighlightsFromBlock(tree.uid, removeOption);
            recursiveCleaning(tree.children);
          }
      }) 
    //    if (extensionAPI.settings.get("color-tags") == null)
            colorTags = colorTagsDefault;
    //    else colorTags = extensionAPI.settings.get("color-tags").replace(' ','').split(",");
    //    if (extensionAPI.settings.get("color-keys") == null)
            colorKeys = colorKeysDefault;
    //    else colorTags = extensionAPI.settings.get("color-keys").replace(' ','').split(",");
        if (extensionAPI.settings.get("keep-color") == null) {
          extensionAPI.settings.set("keep-color", false);
          keepColor = false;
        }
        else keepColor = extensionAPI.settings.get("keep-color");
        if (extensionAPI.settings.get("cursor-position") == null) {
            extensionAPI.settings.set("cursor-position", true);
            cursorAfter = true;
        }
        else cursorAfter = extensionAPI.settings.get("cursor-position");
        if (extensionAPI.settings.get("remove-option") == null) {
          extensionAPI.settings.set("remove-option", false);
          removeOption = false;
      }
      else removeOption = extensionAPI.settings.get("remove-option");

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
        console.log('Color Highlighter loaded.');
    },
    onunload: () => {
      window.removeEventListener("keydown", keyHighlight);
      console.log('Color Highlighter unloaded.');
    }
  };
