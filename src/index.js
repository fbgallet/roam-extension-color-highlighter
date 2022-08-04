window.addEventListener("keydown", keyHighlight);
window.flag = false;
const colorTags = ["#c-blue", "#c-red", "#c-green", "#c-RED"];

function keyHighlight(e) {
  if (window.flag) {
    if (e.key != "Shift") window.flag = false;
    let color='';
    console.log(e.key)
    switch (e.key) {
      case "b": 
        color = colorTags[0];
        break;
      case "r": 
        color = colorTags[1];
        break;
      case "g": 
        color = colorTags[2];
        break;
      case "R": 
        color = colorTags[3];
        break
    }
    if (color!='') {
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
    e.preventDefault();
  }
  if (e.ctrlKey && e.key.toLowerCase() == "h") {
    window.flag = true;
  }
  if ((e.altKey && e.key.toLowerCase() == "h")) {
    window.flag = true;
    removeHighlightsFromBlock();
    setCursorPosition(document.activeElement)
    e.preventDefault();
  }
}

function setCursorPosition(input,start=0,end=0,length=0) {
  setTimeout(() => {
        input = document.activeElement;
        input.selectionStart = input.selectionEnd = end+length+2;
       // input.selectionStart = start+6;
       // input.selectionEnd = end+6;
      },50);
  return;
}

function removeHighlightsFromBlock() {
  let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  let content = getBlockContent(uid);  
  content = content.replaceAll("^^","");
  for(let i=0;i<colorTags.length;i++) {
    content = content.replaceAll(colorTags[i],"");  
  }
  window.roamAlphaAPI
              .updateBlock({'block': 
                  {'uid': uid,
                  'string': content}});
}

function getBlockContent(uid) {
    return window.roamAlphaAPI
                 .q(`[:find (pull ?page [:block/string])
                      :where [?page :block/uid "${uid}"]  ]`
                    )[0][0].string;
}