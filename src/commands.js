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
 *   - applyColorEditFromPopover
 *   - detectWrapperAtCursor
 *   - detectWrapperFromDOM
 *   - detectBlockStyleFromDOM
 *   - getMarkupInfoFromBlocks
 *   - removeHighlightsFromBlock
 *   - getPageViewTreeByBlockUid
 *   - recursiveCleaning
 *   - keyHighlight
 *   - keyHighlightQuickColor
 */
export function createCommands(deps) {
  const {
    extensionAPI,
    getLastMultiselect,
    setLastMultiselect,
    getRemoveOption,
    applyColorFromPopover,
    applyColorChangeFromPopover,
    applyColorEditFromPopover,
    detectWrapperAtCursor,
    detectWrapperFromDOM,
    detectBlockStyleFromDOM,
    getMarkupInfoFromBlocks,
    removeHighlightsFromBlock,
    getPageViewTreeByBlockUid,
    recursiveCleaning,
    keyHighlight,
    keyHighlightQuickColor,
  } = deps;

  function registerToolbarCommands() {
    // Slash command: /color
    // Returning "" tells Roam to remove the typed "/color" text automatically
    // and insert nothing, so _applyColorFromPopoverWrite doesn't need to strip it.
    window.roamAlphaAPI.ui.slashCommand.addCommand({
      label: "Color Highlighter",
      callback: (args) => {
        const slashPos = (args.indexes ?? [null])[0] - 1;
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
      label: "Color Highlighter: Open Toolbar",
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
        // Detect if cursor is inside an existing color wrapper
        const editInfo = detectWrapperAtCursor(uid, selStart);
        if (editInfo.found) {
          showColorPopover(uid, applyColorEditFromPopover, {
            selStart,
            selEnd,
            editMode: true,
            editInfo,
          });
        } else {
          showColorPopover(uid, applyColorFromPopover, { selStart, selEnd });
        }
      },
      "default-hotkey": "ctrl-alt-h",
    });

    window.roamAlphaAPI.ui.msContextMenu.addCommand({
      label: "Color Highlighter: Open Toolbar",
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
      label: "Color Highlighter: Open Toolbar",
    });
    window.roamAlphaAPI.ui.msContextMenu.removeCommand({
      label: "Color Highlighter: Open Toolbar",
    });
    window.roamAlphaAPI.ui.msContextMenu.removeCommand({
      label: "Color Highlighter: Remove color tags",
    });
    window.roamAlphaAPI.ui.msContextMenu.removeCommand({
      label: "Color Highlighter: Change color of highlights",
    });
  }

  function registerAlwaysOnCommands() {
    // Right-click on a styled element (.rm-highlight, .rm-bold, em, .rm-strikethrough)
    // or inside a block-level styled container (.bg-*, .box-*):
    // open toolbar in edit mode instead of showing Roam's context menu.
    const contextMenuHandler = (e) => {
      // Skip if multiselect is active — let bulk operations handle it
      const selected = window.roamAlphaAPI.ui.multiselect.getSelected() ?? [];
      if (selected.length > 0) return;

      // 1. Check if the right-click target itself is an inline styled element
      const t = e.target;
      let isInlineStyled = false;
      if (t.classList) {
        if (
          t.classList.contains("rm-highlight") ||
          t.classList.contains("rm-bold") ||
          t.classList.contains("rm-strikethrough")
        )
          isInlineStyled = true;
      }
      if (!isInlineStyled && t.tagName === "EM") isInlineStyled = true;

      // 2. Check ancestors for block-level style classes (.bg-*, .box-*)
      let blockStyleEl = null;
      if (!isInlineStyled) {
        let ancestor = t.closest("[class*='bg-'], [class*='box-']");
        if (ancestor) {
          const match = [...ancestor.classList].find((c) =>
            /^(bg|box)-(ch-)?[a-zA-Z]+$/.test(c),
          );
          if (match) blockStyleEl = ancestor;
        }
      }

      if (!isInlineStyled && !blockStyleEl) return;

      // Find the block uid from the closest .roam-block element's data attribute
      const blockEl = t.closest(".rm-block");
      if (!blockEl) return;
      const uid = blockEl.getAttribute("data-block-uid");
      if (!uid) return;

      const editInfo = isInlineStyled
        ? detectWrapperFromDOM(uid, t)
        : detectBlockStyleFromDOM(uid, blockStyleEl);

      if (!editInfo.found) return;

      // Prevent native context menu and open toolbar in edit mode
      e.preventDefault();
      e.stopPropagation();
      showColorPopover(uid, applyColorEditFromPopover, {
        editMode: true,
        editInfo,
      });
    };
    window.addEventListener("contextmenu", contextMenuHandler, true);

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
    window.roamAlphaAPI.ui.blockContextMenu.addCommand({
      label: "Color Highlighter: Remove color tags",
      "display-conditional": (e) => e["block-string"].includes("#c:"),
      callback: (e) =>
        removeHighlightsFromBlock(e["block-uid"], getRemoveOption()),
    });

    return { snapshotHandler, contextMenuHandler };
  }

  function unregisterAlwaysOnCommands(handlers) {
    window.removeEventListener("keydown", handlers.snapshotHandler, true);
    window.removeEventListener(
      "contextmenu",
      handlers.contextMenuHandler,
      true,
    );
    extensionAPI.ui.commandPalette.removeCommand({
      label: "Color Highlighter: Remove color tags from current BLOCK",
    });
    extensionAPI.ui.commandPalette.removeCommand({
      label: "Color Highlighter: Remove color tags from current PAGE zoom view",
    });
    window.roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label: "Color Highlighter: Remove color tags",
    });
  }

  function registerKeyboardListener() {
    window.addEventListener("keydown", keyHighlight);
  }

  function unregisterKeyboardListener() {
    window.removeEventListener("keydown", keyHighlight);
  }

  function registerQuickColorListener() {
    window.addEventListener("keydown", keyHighlightQuickColor, true);
  }

  function unregisterQuickColorListener() {
    window.removeEventListener("keydown", keyHighlightQuickColor, true);
  }

  return {
    registerToolbarCommands,
    unregisterToolbarCommands,
    registerAlwaysOnCommands,
    unregisterAlwaysOnCommands,
    registerKeyboardListener,
    unregisterKeyboardListener,
    registerQuickColorListener,
    unregisterQuickColorListener,
  };
}
