import { showColorPopover } from "./colorPopover";
import { getBlockContentByUid } from "./roamAPI";

/**
 * Creates and returns the register/unregister functions for all commands and menus.
 * deps: object containing shared callbacks and state accessors from index.js
 *   - extensionAPI
 *   - getLastMultiselect / setLastMultiselect  (snapshot state)
 *   - getRemoveOption                          (setting accessor)
 *   - applyColorFromPopover
 *   - applyColorChangeFromPopover
 *   - getMarkupInfoFromBlocks
 *   - removeHighlightsFromBlock
 *   - getPageViewTreeByBlockUid
 *   - recursiveCleaning
 *   - setColorCallback
 *   - keyHighlight
 */
export function createCommands(deps) {
  const {
    extensionAPI,
    getLastMultiselect,
    setLastMultiselect,
    getRemoveOption,
    applyColorFromPopover,
    applyColorChangeFromPopover,
    getMarkupInfoFromBlocks,
    removeHighlightsFromBlock,
    getPageViewTreeByBlockUid,
    recursiveCleaning,
    setColorCallback,
    keyHighlight,
  } = deps;

  function registerToolbarCommands() {
    // Slash command: /color
    // Returning "" tells Roam to remove the typed "/color" text automatically
    // and insert nothing, so _applyColorFromPopoverWrite doesn't need to strip it.
    window.roamAlphaAPI.ui.slashCommand.addCommand({
      label: "Color Highlighter",
      callback: (args) => {
        const slashPos = (args.indexes ?? [null])[0];
        setTimeout(
          () =>
            showColorPopover(args["block-uid"], applyColorFromPopover, {
              selStart: slashPos,
            }),
          50,
        );
        return "";
      },
    });

    // Command palette: color popover
    // Block multiselect is not lost when the palette opens, so read it live.
    // Text selection IS lost, so we use the snapshot captured on Cmd/Ctrl+P.
    extensionAPI.ui.commandPalette.addCommand({
      label: "Color Highlighter: Color popover",
      callback: () => {
        const selectedBlocks =
          window.roamAlphaAPI.ui.multiselect.getSelected() ?? [];
        if (selectedBlocks.length > 0) {
          const selectedUids = selectedBlocks.map((b) => b["block-uid"]);
          showColorPopover(null, applyColorFromPopover, { selectedUids });
          return;
        }
        const snapshot = getLastMultiselect();
        setLastMultiselect(null);
        const uid =
          snapshot?.uid ??
          window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        if (!uid) return;
        // If snapshot exists, use it (Cmd+P path: textarea focus was lost when palette opened).
        // Otherwise read live from the active textarea (hotkey path: block is still focused).
        const textarea = document.activeElement;
        const selStart =
          snapshot?.selStart ??
          (textarea?.tagName === "TEXTAREA" ? textarea.selectionStart : null);
        const selEnd =
          snapshot?.selEnd ??
          (textarea?.tagName === "TEXTAREA" ? textarea.selectionEnd : null);
        showColorPopover(uid, applyColorFromPopover, { selStart, selEnd });
      },
    });

    window.roamAlphaAPI.ui.msContextMenu.addCommand({
      label: "Color Highlighter: Display Toolbar",
      callback: (e) => {
        const blocks =
          e?.blocks ?? window.roamAlphaAPI.ui.multiselect.getSelected() ?? [];
        if (blocks.length === 0) return;
        const selectedUids = blocks.map((b) => b["block-uid"]);
        showColorPopover(null, applyColorFromPopover, { selectedUids });
      },
    });

    window.roamAlphaAPI.ui.msContextMenu.addCommand({
      label: "Color Highlighter: Remove color tags",
      "display-conditional": (e) => {
        const blocks = e?.blocks ?? [];
        return blocks.some((b) => {
          const s = getBlockContentByUid(b["block-uid"]);
          return s.includes("#c:") || s.includes("#.bg");
        });
      },
      callback: (e) => {
        const blocks =
          e?.blocks ?? window.roamAlphaAPI.ui.multiselect.getSelected() ?? [];
        if (blocks.length === 0) return;
        blocks.forEach((b) =>
          removeHighlightsFromBlock(b["block-uid"], getRemoveOption()),
        );
      },
    });

    window.roamAlphaAPI.ui.msContextMenu.addCommand({
      label: "Color Highlighter: Change color of highlights",
      "display-conditional": (e) => {
        const blocks = e?.blocks ?? [];
        return blocks.some((b) => {
          const s = getBlockContentByUid(b["block-uid"]);
          return (
            s.includes("^^") ||
            s.includes("**") ||
            s.includes("__") ||
            s.includes("~~")
          );
        });
      },
      callback: (e) => {
        const blocks =
          e?.blocks ?? window.roamAlphaAPI.ui.multiselect.getSelected() ?? [];
        if (blocks.length === 0) return;
        const selectedUids = blocks.map((b) => b["block-uid"]);
        const { presentMarkups, isSingleMarkupType, currentColorKeys } =
          getMarkupInfoFromBlocks(selectedUids);
        showColorPopover(null, applyColorChangeFromPopover, {
          selectedUids,
          changeMode: true,
          presentMarkups,
          isSingleMarkupType,
          currentColorKeys,
        });
      },
    });
  }

  function unregisterToolbarCommands() {
    window.roamAlphaAPI.ui.slashCommand.removeCommand({
      label: "Color Highlighter",
    });
    extensionAPI.ui.commandPalette.removeCommand({
      label: "Color Highlighter: Color popover",
    });
    window.roamAlphaAPI.ui.msContextMenu.removeCommand({
      label: "Color Highlighter: Display Toolbar",
    });
    window.roamAlphaAPI.ui.msContextMenu.removeCommand({
      label: "Color Highlighter: Remove color tags",
    });
    window.roamAlphaAPI.ui.msContextMenu.removeCommand({
      label: "Color Highlighter: Change color of highlights",
    });
  }

  function registerAlwaysOnCommands() {
    // Snapshot text selection just before the command palette opens (Cmd/Ctrl+P),
    // because the palette steals focus and clears textarea selection.
    // Block multiselect is NOT lost when the palette opens, so no snapshot needed for it.
    const snapshotHandler = (e) => {
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        const textarea = document.activeElement;
        setLastMultiselect({
          uid: window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"] ?? null,
          selStart: textarea?.selectionStart ?? null,
          selEnd: textarea?.selectionEnd ?? null,
        });
      }
    };
    window.addEventListener("keydown", snapshotHandler, true);

    extensionAPI.ui.commandPalette.addCommand({
      label: "Color Highlighter: Remove color tags from current BLOCK",
      callback: () => {
        let block = window.roamAlphaAPI.ui.getFocusedBlock();
        removeHighlightsFromBlock(block["block-uid"], getRemoveOption());
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
            removeHighlightsFromBlock(tree.uid, getRemoveOption());
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
      label:
        "Color Highlighter: Set color of box texts in current block (+letter or Backspace)",
      callback: () => {
        let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        setColorCallback(uid, "~~");
      },
    });
    extensionAPI.ui.commandPalette.addCommand({
      label: "Color Highlighter: Set background color, this block only",
      callback: () => {
        let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        setColorCallback(uid, "#.bg-");
      },
    });
    extensionAPI.ui.commandPalette.addCommand({
      label: "Color Highlighter: Set background color, with children",
      callback: () => {
        let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        setColorCallback(uid, "#.bg-ch-");
      },
    });
    extensionAPI.ui.commandPalette.addCommand({
      label: "Color Highlighter: Set box color, this block only",
      callback: () => {
        let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        setColorCallback(uid, "#.box-");
      },
    });
    extensionAPI.ui.commandPalette.addCommand({
      label: "Color Highlighter: Set box color, with children",
      callback: () => {
        let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        setColorCallback(uid, "#.box-ch-");
      },
    });

    window.roamAlphaAPI.ui.blockContextMenu.addCommand({
      label: "Color Highlighter: Remove color tags",
      "display-conditional": (e) => e["block-string"].includes("#c:"),
      callback: (e) =>
        removeHighlightsFromBlock(e["block-uid"], getRemoveOption()),
    });
    window.roamAlphaAPI.ui.blockContextMenu.addCommand({
      label:
        "Color Highlighter: Set color of highlights (& press a letter or Backspace)",
      "display-conditional": (e) => e["block-string"].includes("^^"),
      callback: (e) => setColorCallback(e["block-uid"], "^^"),
    });
    window.roamAlphaAPI.ui.blockContextMenu.addCommand({
      label:
        "Color Highlighter: Set color of bold texts (& press a letter or Backspace)",
      "display-conditional": (e) => e["block-string"].includes("**"),
      callback: (e) => setColorCallback(e["block-uid"], "**"),
    });
    window.roamAlphaAPI.ui.blockContextMenu.addCommand({
      label:
        "Color Highlighter: Set color of underlined texts (& press a letter or Backspace)",
      "display-conditional": (e) => e["block-string"].includes("__"),
      callback: (e) => setColorCallback(e["block-uid"], "__"),
    });
    window.roamAlphaAPI.ui.blockContextMenu.addCommand({
      label:
        "Color Highlighter: Set color of box texts (& press a letter or Backspace)",
      "display-conditional": (e) => e["block-string"].includes("~~"),
      callback: (e) => setColorCallback(e["block-uid"], "~~"),
    });
    window.roamAlphaAPI.ui.blockContextMenu.addCommand({
      label: "Color Highlighter: Set background color, this block only",
      callback: (e) => setColorCallback(e["block-uid"], "#.bg-"),
    });
    window.roamAlphaAPI.ui.blockContextMenu.addCommand({
      label: "Color Highlighter: Set background color, with children",
      callback: (e) => setColorCallback(e["block-uid"], "#.bg-ch-"),
    });
    window.roamAlphaAPI.ui.blockContextMenu.addCommand({
      label: "Color Highlighter: Set box color, this block only",
      callback: (e) => setColorCallback(e["block-uid"], "#.box-"),
    });
    window.roamAlphaAPI.ui.blockContextMenu.addCommand({
      label: "Color Highlighter: Set box color, with children",
      callback: (e) => setColorCallback(e["block-uid"], "#.box-ch-"),
    });

    return snapshotHandler;
  }

  function unregisterAlwaysOnCommands(snapshotHandler) {
    window.removeEventListener("keydown", snapshotHandler, true);
    extensionAPI.ui.commandPalette.removeCommand({
      label: "Color Highlighter: Remove color tags from current BLOCK",
    });
    extensionAPI.ui.commandPalette.removeCommand({
      label: "Color Highlighter: Remove color tags from current PAGE zoom view",
    });
    extensionAPI.ui.commandPalette.removeCommand({
      label:
        "Color Highlighter: Set color of highlights in current block (+letter or Backspace)",
    });
    extensionAPI.ui.commandPalette.removeCommand({
      label:
        "Color Highlighter: Set color of bolded texts in current block (+letter or Backspace)",
    });
    extensionAPI.ui.commandPalette.removeCommand({
      label:
        "Color Highlighter: Set color of underlined texts in current block (+letter or Backspace)",
    });
    extensionAPI.ui.commandPalette.removeCommand({
      label:
        "Color Highlighter: Set color of box texts in current block (+letter or Backspace)",
    });
    extensionAPI.ui.commandPalette.removeCommand({
      label: "Color Highlighter: Set background color, this block only",
    });
    extensionAPI.ui.commandPalette.removeCommand({
      label: "Color Highlighter: Set background color, with children",
    });
    extensionAPI.ui.commandPalette.removeCommand({
      label: "Color Highlighter: Set box color, this block only",
    });
    extensionAPI.ui.commandPalette.removeCommand({
      label: "Color Highlighter: Set box color, with children",
    });
    window.roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label: "Color Highlighter: Remove color tags",
    });
    window.roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label:
        "Color Highlighter: Set color of highlights (& press a letter or Backspace)",
    });
    window.roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label:
        "Color Highlighter: Set color of bold texts (& press a letter or Backspace)",
    });
    window.roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label:
        "Color Highlighter: Set color of underlined texts (& press a letter or Backspace)",
    });
    window.roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label:
        "Color Highlighter: Set color of box texts (& press a letter or Backspace)",
    });
    window.roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label: "Color Highlighter: Set background color, this block only",
    });
    window.roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label: "Color Highlighter: Set background color, with children",
    });
    window.roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label: "Color Highlighter: Set box color, this block only",
    });
    window.roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label: "Color Highlighter: Set box color, with children",
    });
  }

  function registerKeyboardListener() {
    window.addEventListener("keydown", keyHighlight);
  }

  function unregisterKeyboardListener() {
    window.removeEventListener("keydown", keyHighlight);
  }

  return {
    registerToolbarCommands,
    unregisterToolbarCommands,
    registerAlwaysOnCommands,
    unregisterAlwaysOnCommands,
    registerKeyboardListener,
    unregisterKeyboardListener,
  };
}
