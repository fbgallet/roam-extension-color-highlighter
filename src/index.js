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
var cursorAfter;

function keyHighlight(e) {
  if (hFlag) {
    if (!e.shiftKey && !e.ctrlKey) hFlag = false;
    if (!needConfirmKey) {
      let color = checkColorKeys(e.key);
      if (color!='') {
        addColor(color);
        e.preventDefault();
      }
    }
    if (e.ctrlKey) needConfirmKey=false;
  }
  if (tFlag) {
    if (!e.shiftKey && !e.ctrlKey) tFlag = false;
    if (!needConfirmKey) {
      let color = checkColorKeys(e.key);
      if (color!='') {
        addColor(color);
        e.preventDefault();
      }
    }
    if (e.ctrlKey) needConfirmKey=false;
  }
  if (tFlag !=true && hFlag!=true) {
    if (e.ctrlKey && e.key == "h") {
      hFlag = true;
      if (hasSelection()) needConfirmKey=false;
      else needConfirmKey=true;
      return;
    }
    if (e.ctrlKey && e.key == "b") {
      tFlag = true;
      if (hasSelection()) needConfirmKey=false;
      else needConfirmKey=true;
    }
    if ((e.altKey && e.key == "h")) {
      //hFlag = true;
      removeHighlightsFromBlock();
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
/*
function countDown(c) {
  setTimeout(( ) ⇒ {

  })
}*/

function addColor(color) {
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
      },50);
  return;
}

function removeHighlightsFromBlock(uid, removeH=false,removeB=false,removeI=false) {
  //let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  let content = getBlockContent(uid);  
  content = removeFromContent(content, removeH, removeB, removeI);
  setTimeout(function() {
    window.roamAlphaAPI
              .updateBlock({'block': 
                  {'uid': uid,
                  'string': content}});
  },10)
  
}

function removeFromContent(content, removeH=false,removeB=false,removeI=false) {
  if (removeH) content = content.replaceAll("^^","");
  if (removeB) content = content.replaceAll("**","");
  if (removeI) content = content.replaceAll("__","");
  for(let i=0;i<colorTags.length;i++) {
    content = content.replaceAll(colorTags[i],"");  
  }
  return content;
}

function recursiveCleaning(branch) {
  for (let i=0;i<branch.length;i++) {
    let nodeUid = branch[i].uid; 
    let nodeContent = branch[i].string;
    let newContent = removeFromContent(nodeContent);
    console.log(newContent)
    console.log(nodeUid);
    if (nodeContent.length != newContent.length) {
      //console.log(nodeContent);

      setTimeout(function() {
        window.roamAlphaAPI
                  .updateBlock({'block': 
                      {'uid': nodeUid,
                      'string': newContent}})
      }, 50);
    }
    if (branch[i].children) recursiveCleaning(branch[i].children);
  }
}

function getPageTreeByBlockUid(bUid) {
  let tree = window.roamAlphaAPI.q(`
    [:find (pull ?page 
      [ :block/string :block/uid :block/children
        {:block/page ...}
        {:block/children ...}])
          :where [?page :block/uid "${bUid}"]]`)[0][0];
  if (tree.page) return tree.page.children;
  else return tree.children;
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
        {id:     "color-tags",
        name:   "Color tags",
        description: "Customized list of color tags, separated with a comma",
        action: {type:        "input",
                placeholder: "#c:red, #c:green",
                onChange:    (evt) => { 
//                  colorTags = evt.target.value;
                 }}},
        {id:     "color-keys",
         name:   "Color keys",
         description: "Customized list of unique keys to trigger colors, in the same ordre as color tags",
         action: {type:     "input",
                  onChange: (evt) => { 
        //         colorKeys = evt.taget.value;
         }}},
        {id:          "cursor-position",
        name:        "Cursor just after highlighted/colored text",
        description: "If disabled, text highlighted/colored will be selected (native Roam behavior)",
        action:      {type:     "switch",
                      onChange: (evt) => { 
                        cursorAfter = !cursorAfter;
                      }}}
    ]
  }; 

export default {
    onload:  ({extensionAPI}) => {
        extensionAPI.settings.panel.create(panelConfig);
        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Remove color tags from current block (Color Highlighter extension)",
            callback: () => {
                let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                removeHighlightsFromBlock(uid);
            }
        })
        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Remove color tags & bold/hightlighs/italics markups from current block (Color Highlighter extension)",
            callback: () => {
                let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                removeHighlightsFromBlock(uid, true,true,true);
            }
        })
        window.roamAlphaAPI.ui.commandPalette.addCommand({
          label: "Remove all color tags from current page (Color Highlighter extension)",
          callback: async () => {        
            let uid = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();             
            console.log(uid);
            const pageTree = getPageTreeByBlockUid(uid);
            recursiveCleaning(pageTree);
          }
      }) 
        if (extensionAPI.settings.get("color-tags") == null)
            colorTags = colorTagsDefault;
        else colorTags = extensionAPI.settings.get("color-tags").replace(' ','').split(",");
        if (extensionAPI.settings.get("color-keys") == null)
            colorKeys = colorKeysDefault;
        else colorTags = extensionAPI.settings.get("color-keys").replace(' ','').split(",");
        if (extensionAPI.settings.get("cursor-position") == null) {
            extensionAPI.settings.set("cursor-position", true);
            cursorAfter = true;
        }
        else cursorAfter = extensionAPI.settings.get("cursor-position");

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
