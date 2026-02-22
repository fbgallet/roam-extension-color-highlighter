import React from "react";
import ReactDOM from "react-dom";
import { colorPalette, formatTypes } from "./colorPalette";

const LS_FORMAT_KEY = "cl-last-format";
const LS_COLOR_KEY = "cl-last-color";
const LS_CHILDREN_KEY = "cl-with-children";

let popoverPortal = null;

function createPopoverPortal() {
  if (popoverPortal) return popoverPortal;
  popoverPortal = document.createElement("div");
  popoverPortal.id = "cl-color-popover-portal";
  document.body.appendChild(popoverPortal);
  return popoverPortal;
}

export function destroyPopoverPortal() {
  if (popoverPortal) {
    ReactDOM.unmountComponentAtNode(popoverPortal);
    popoverPortal.remove();
    popoverPortal = null;
  }
}

const POPOVER_HEIGHT = 180; // approximate popover height in px
const POPOVER_WIDTH = 300; // approximate popover width in px
const GAP = 8; // gap between popover and anchor

function getPopoverPosition(selectedUids) {
  let anchorTop, anchorBottom, anchorLeft, anchorWidth;

  // --- Multi-block selection: use the first .block-highlight-blue element ---
  if (selectedUids && selectedUids.length > 0) {
    const firstHighlight = document.querySelector(".block-highlight-blue");
    if (firstHighlight) {
      const rect = firstHighlight.getBoundingClientRect();
      anchorTop = rect.top;
      anchorBottom = rect.bottom;
      anchorLeft = rect.left;
      anchorWidth = rect.width;
    }
  }

  // --- Single block: use the active textarea ---
  if (anchorTop === undefined) {
    const textarea = document.activeElement;
    if (textarea && textarea.tagName === "TEXTAREA") {
      const rect = textarea.getBoundingClientRect();
      anchorTop = rect.top;
      anchorBottom = rect.bottom;
      anchorLeft = rect.left;
      anchorWidth = rect.width;
    }
  }

  // --- Fallback: centre of screen ---
  if (anchorTop === undefined) {
    return {
      top: window.innerHeight / 3,
      left: Math.max(10, window.innerWidth / 2 - POPOVER_WIDTH / 2),
    };
  }

  // Preferred: above the anchor (bottom of popover = anchorTop - GAP)
  let top = anchorTop - POPOVER_HEIGHT - GAP;
  // Flip below if not enough space above
  if (top < 10) {
    top = anchorBottom + GAP;
  }

  // Horizontally centred on the anchor, clamped to viewport
  const centreX = anchorLeft + anchorWidth / 2;
  let left = centreX - POPOVER_WIDTH / 2;

  return {
    top: Math.max(10, top),
    left: Math.max(10, Math.min(left, window.innerWidth - POPOVER_WIDTH - 10)),
  };
}

// focusedCell: { row: 0|1|null, col: 0..N-1 } or null (nothing focused / format row)
// row 0 = light, row 1 = dark
// focusedFmt: index of focused format button, or null

function HelpDialog({ onClose }) {
  const sections = [
    {
      title: "Open the toolbar",
      rows: [
        ["Hotkey (configurable)", "Open toolbar on focused block"],
        ["/color", "Slash command inside a block"],
        ["Cmd/Ctrl+P → Color popover", "Via command palette"],
        ["Right-click block(s)", "Block / multiselect context menu"],
      ],
    },
    {
      title: "Inside the toolbar",
      rows: [
        ["1–6", "Select format (Highlight, Text, Underline, Box, BG, Block box)"],
        ["7", "Toggle +children (block formats)"],
        ["b f g o s r t y w", "Apply light color (blue, fuchsia, green, orange, silver, red, teal, yellow, black)"],
        ["B F G O S R T Y W", "Apply dark variant (Shift + letter)"],
        ["Backspace", "Remove color tag"],
        ["Enter", "Re-apply last used color"],
        ["↑ ↓ ← →", "Navigate format / swatch grid"],
        ["Ctrl/Cmd+click", "Combine two block formats"],
        ["Esc", "Close toolbar"],
      ],
    },
    {
      title: "Other commands (command palette / context menu)",
      rows: [
        ["Remove color tags", "Strip all color tags from current block"],
        ["Remove color tags (page)", "Strip all color tags in current page view"],
        ["Change color of highlights", "Multiselect context menu — change existing colors"],
      ],
    },
  ];

  return React.createElement(
    "div",
    {
      className: "cl-help-overlay",
      onMouseDown: (e) => { e.stopPropagation(); e.preventDefault(); },
    },
    React.createElement(
      "div",
      { className: "cl-help-dialog" },
      // Header
      React.createElement(
        "div",
        { className: "cl-help-header" },
        React.createElement("span", { className: "cl-help-title" }, "Color Highlighter — Shortcuts"),
        React.createElement(
          "button",
          { className: "bp3-button bp3-minimal bp3-small", onClick: onClose, tabIndex: -1 },
          React.createElement("span", { className: "bp3-icon bp3-icon-cross" }),
        ),
      ),
      // Sections
      ...sections.map((sec) =>
        React.createElement(
          "div",
          { key: sec.title, className: "cl-help-section" },
          React.createElement("div", { className: "cl-help-section-title" }, sec.title),
          React.createElement(
            "table",
            { className: "cl-help-table" },
            React.createElement(
              "tbody",
              null,
              ...sec.rows.map(([kbd, desc], i) =>
                React.createElement(
                  "tr",
                  { key: i },
                  React.createElement("td", { className: "cl-help-kbd" },
                    React.createElement("kbd", null, kbd)
                  ),
                  React.createElement("td", { className: "cl-help-desc" }, desc),
                ),
              ),
            ),
          ),
        ),
      ),
      // Support section
      React.createElement("div", { className: "cl-help-divider" }),
      React.createElement(
        "div",
        { className: "cl-help-support" },
        React.createElement("strong", null, "How to support my work?"),
        React.createElement("br"),
        "Become a ",
        React.createElement("a", { href: "https://github.com/sponsors/fbgallet", target: "_blank", rel: "noopener noreferrer" }, "Github sponsor"),
        ", ",
        React.createElement("a", { href: "https://buymeacoffee.com/fbgallet", target: "_blank", rel: "noopener noreferrer" }, "buy me a coffee"),
        " or follow @fbgallet on ",
        React.createElement("a", { href: "https://x.com/fbgallet", target: "_blank", rel: "noopener noreferrer" }, "X"),
        ", on ",
        React.createElement("a", { href: "https://bsky.app/profile/fbgallet.bsky.social", target: "_blank", rel: "noopener noreferrer" }, "Bluesky"),
        " or on ",
        React.createElement("a", { href: "https://mastodon.social/@fbgallet", target: "_blank", rel: "noopener noreferrer" }, "Mastodon"),
        ".",
      ),
    ),
  );
}

class ColorPopover extends React.Component {
  constructor(props) {
    super(props);

    const savedFormat =
      parseInt(localStorage.getItem(LS_FORMAT_KEY) ?? "0") || 0;
    const savedColorKey = localStorage.getItem(LS_COLOR_KEY) ?? null;
    const savedWithChildren = localStorage.getItem(LS_CHILDREN_KEY) === "1";

    let initialFormat = Math.min(savedFormat, formatTypes.length - 1);
    if (
      props.changeMode &&
      props.isSingleMarkupType &&
      props.presentMarkups?.length === 1
    ) {
      const autoIdx = formatTypes.findIndex(
        (f) => f.markup === props.presentMarkups[0],
      );
      if (autoIdx !== -1) initialFormat = autoIdx;
    }

    this.state = {
      selectedFormat: initialFormat,
      extraBlockFormat: null,
      withChildren: savedWithChildren,
      lastColorKey: savedColorKey,
      focusedCell: null,
      focusedFmt: null,
      showHelp: false,
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.containerRef = null;
    this.swatchRefs = [[], []]; // [lightRow[], darkRow[]]
    this.fmtRefs = [];
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown, true);
    document.addEventListener("mousedown", this.handleClickOutside);
    if (this.containerRef) this.containerRef.focus();
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown, true);
    document.removeEventListener("mousedown", this.handleClickOutside);
  }

  handleClickOutside(e) {
    if (this.containerRef && !this.containerRef.contains(e.target)) {
      this.close();
    }
  }

  handleKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (this.state.showHelp) {
        this.setState({ showHelp: false });
      } else {
        this.close();
      }
      return;
    }

    // Arrow navigation
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      this.handleArrow(e.key);
      return;
    }

    // Enter applies last used color (when no swatch is explicitly focused)
    if (e.key === "Enter") {
      const { focusedCell, lastColorKey } = this.state;
      if (focusedCell !== null) {
        // A swatch is focused — let it be activated via click handler / focus
        // We trigger applyColor from the focused swatch
        const { row, col } = focusedCell;
        const c = colorPalette[col];
        const key = row === 0 ? c.key : c.key.toUpperCase();
        e.preventDefault();
        e.stopPropagation();
        this.applyColor(key);
        return;
      }
      if (lastColorKey !== null) {
        e.preventDefault();
        e.stopPropagation();
        this.applyColor(lastColorKey);
        return;
      }
      return;
    }

    // Number keys 1–N select format; N+1 toggles children (when visible)
    const num = parseInt(e.key);
    if (num >= 1 && num <= formatTypes.length) {
      e.preventDefault();
      e.stopPropagation();
      const idx = num - 1;
      this.setState({
        selectedFormat: idx,
        extraBlockFormat: null,
        focusedFmt: null,
      });
      if (!this.props.changeMode)
        localStorage.setItem(LS_FORMAT_KEY, String(idx));
      return;
    }
    if (num === formatTypes.length + 1) {
      const fmt = formatTypes[this.state.selectedFormat];
      if (fmt.supportsChildren) {
        e.preventDefault();
        e.stopPropagation();
        this.toggleChildren();
      }
      return;
    }

    // Color keys (lowercase or uppercase via Shift)
    const colorEntry = colorPalette.find((c) => c.key === e.key.toLowerCase());
    if (colorEntry && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      const colorKey = e.shiftKey ? e.key.toUpperCase() : e.key.toLowerCase();
      this.applyColor(colorKey);
      return;
    }

    // Backspace removes color
    if (e.key === "Backspace") {
      e.preventDefault();
      e.stopPropagation();
      this.applyColor("Backspace");
      return;
    }
  }

  handleArrow(key) {
    const { focusedCell, focusedFmt } = this.state;
    const nCols = colorPalette.length;
    const nFmts = formatTypes.length;

    if (focusedFmt !== null) {
      // In format row
      if (key === "ArrowLeft") {
        const next = (focusedFmt - 1 + nFmts) % nFmts;
        this.setState({ focusedFmt: next });
        this.fmtRefs[next]?.focus();
      } else if (key === "ArrowRight") {
        const next = (focusedFmt + 1) % nFmts;
        this.setState({ focusedFmt: next });
        this.fmtRefs[next]?.focus();
      } else if (key === "ArrowDown") {
        // Move to light row, same col (clamp)
        const col = Math.min(focusedFmt, nCols - 1);
        this.setState({ focusedFmt: null, focusedCell: { row: 0, col } });
        this.swatchRefs[0][col]?.focus();
      }
      // ArrowUp from format row does nothing
      return;
    }

    if (focusedCell !== null) {
      const { row, col } = focusedCell;
      if (key === "ArrowLeft") {
        const nextCol = (col - 1 + nCols) % nCols;
        this.setState({ focusedCell: { row, col: nextCol } });
        this.swatchRefs[row][nextCol]?.focus();
      } else if (key === "ArrowRight") {
        const nextCol = (col + 1) % nCols;
        this.setState({ focusedCell: { row, col: nextCol } });
        this.swatchRefs[row][nextCol]?.focus();
      } else if (key === "ArrowUp") {
        if (row === 1) {
          // Move to light row
          this.setState({ focusedCell: { row: 0, col } });
          this.swatchRefs[0][col]?.focus();
        } else {
          // Move to format row
          const fmtIdx = Math.min(col, nFmts - 1);
          this.setState({ focusedCell: null, focusedFmt: fmtIdx });
          this.fmtRefs[fmtIdx]?.focus();
        }
      } else if (key === "ArrowDown") {
        if (row === 0) {
          // Move to dark row
          this.setState({ focusedCell: { row: 1, col } });
          this.swatchRefs[1][col]?.focus();
        }
        // ArrowDown from dark row does nothing
      }
      return;
    }

    // Nothing focused — start navigation
    if (key === "ArrowDown") {
      this.setState({ focusedCell: { row: 0, col: 0 } });
      this.swatchRefs[0][0]?.focus();
    } else if (key === "ArrowUp") {
      this.setState({ focusedFmt: 0 });
      this.fmtRefs[0]?.focus();
    } else if (key === "ArrowRight" || key === "ArrowLeft") {
      this.setState({ focusedFmt: 0 });
      this.fmtRefs[0]?.focus();
    }
  }

  resolveMarkup(fmtIndex) {
    const fmt = formatTypes[fmtIndex];
    let markup = fmt.markup;
    if (this.state.withChildren && fmt.supportsChildren) {
      markup = markup.replace(/^(#\.[a-z]+-)(ch-)?/, "$1ch-");
    }
    return markup;
  }

  applyColor(key) {
    const { selectedFormat, extraBlockFormat } = this.state;
    const isUpperVariant = key.length === 1 && key !== key.toLowerCase();
    const syntheticEvent = {
      key: key,
      shiftKey: isUpperVariant,
      preventDefault: () => {},
    };
    const { selStart, selEnd, selectedUids } = this.props;

    if (key !== "Backspace") {
      localStorage.setItem(LS_COLOR_KEY, key);
    }

    const markup = this.resolveMarkup(selectedFormat);
    const extraMarkup =
      extraBlockFormat !== null ? this.resolveMarkup(extraBlockFormat) : null;

    this.props.onApplyColor(
      syntheticEvent,
      this.props.uid,
      markup,
      selStart,
      selEnd,
      extraMarkup,
      selectedUids,
    );
    this.close();
  }

  selectFormat(i, withModifier = false) {
    const { selectedFormat } = this.state;
    const clickedFmt = formatTypes[i];
    const primaryFmt = formatTypes[selectedFormat];

    // Modifier + click on a supportsChildren button while primary is also supportsChildren:
    // toggle it as the extra co-selected block format
    if (
      withModifier &&
      clickedFmt.supportsChildren &&
      primaryFmt.supportsChildren &&
      i !== selectedFormat
    ) {
      this.setState((s) => ({
        extraBlockFormat: s.extraBlockFormat === i ? null : i,
      }));
      return;
    }

    // Regular click: switch primary, clear extra
    this.setState({ selectedFormat: i, extraBlockFormat: null });
    if (!this.props.changeMode) localStorage.setItem(LS_FORMAT_KEY, String(i));
  }

  toggleChildren() {
    const next = !this.state.withChildren;
    this.setState({ withChildren: next });
    localStorage.setItem(LS_CHILDREN_KEY, next ? "1" : "0");
  }

  close() {
    const portal = document.getElementById("cl-color-popover-portal");
    if (portal) ReactDOM.unmountComponentAtNode(portal);
  }

  render() {
    const {
      selectedFormat,
      extraBlockFormat,
      withChildren,
      lastColorKey,
      focusedCell,
      focusedFmt,
    } = this.state;
    const pos = this.props.position;
    const { changeMode, presentMarkups, currentColorKeys } = this.props;
    const selectedFmt = formatTypes[selectedFormat];
    const currentMarkup = selectedFmt.markup;
    const showMixedWarning =
      changeMode && !presentMarkups?.includes(currentMarkup);
    const currentColorKeysForMarkup =
      changeMode && currentColorKeys
        ? (currentColorKeys[currentMarkup] ?? [])
        : [];
    const showChildrenToggle = selectedFmt.supportsChildren === true;

    // Reset swatch refs arrays for fresh render
    this.swatchRefs = [
      new Array(colorPalette.length).fill(null),
      new Array(colorPalette.length).fill(null),
    ];
    this.fmtRefs = new Array(formatTypes.length).fill(null);

    const formatButtons = formatTypes.flatMap((fmt, i) => {
      const isActive = i === selectedFormat || i === extraBlockFormat;
      const btn = React.createElement(
        "button",
        {
          key: fmt.id,
          className:
            "bp3-button bp3-small cl-fmt-btn" +
            (isActive ? " bp3-active bp3-intent-primary" : "") +
            (focusedFmt === i ? " cl-fmt-btn-focused" : ""),
          onClick: (e) => this.selectFormat(i, e.ctrlKey || e.metaKey),
          title: fmt.supportsChildren
            ? fmt.label +
              " (" +
              fmt.shortcut +
              ") — Ctrl/Cmd+click to combine with other block style"
            : fmt.label + " (" + fmt.shortcut + ")",
          tabIndex: -1,
          ref: (el) => {
            this.fmtRefs[i] = el;
          },
          onFocus: () => this.setState({ focusedFmt: i, focusedCell: null }),
        },
        React.createElement("span", {
          className: "bp3-icon bp3-icon-" + fmt.icon,
        }),
        React.createElement(
          "span",
          { className: "cl-fmt-shortcut" },
          fmt.shortcut,
        ),
      );
      if (fmt.groupStart) {
        return [
          React.createElement("div", {
            key: fmt.id + "-sep",
            className: "cl-fmt-separator",
          }),
          btn,
        ];
      }
      return [btn];
    });

    const makeRow = (rowIndex, variants, currentKeys) =>
      variants.map((v, col) => {
        const c = v.color;
        const key = v.key;
        const isLight = rowIndex === 0;
        const isFocused =
          focusedCell &&
          focusedCell.row === rowIndex &&
          focusedCell.col === col;
        const isLastUsed = lastColorKey !== null && key === lastColorKey;
        const isCurrentColor = currentKeys.includes(key);

        // Determine label text color: dark on light colors, white on dark
        const labelColor = isLight
          ? "rgba(0,0,0,0.55)"
          : "rgba(255,255,255,0.85)";

        // Special cases
        const bgColor = v.bg;
        const isBlack = bgColor === "#000000";
        const finalLabelColor = isBlack ? "rgba(255,255,255,0.75)" : labelColor;

        return React.createElement(
          "button",
          {
            key: c.name + (isLight ? "-light" : "-dark"),
            className:
              "cl-color-swatch" +
              (isCurrentColor ? " cl-swatch-current-color" : "") +
              (isLastUsed ? " cl-swatch-last-used" : "") +
              (isFocused ? " cl-swatch-focused" : ""),
            style: {
              backgroundColor: bgColor,
              border: isFocused
                ? "2px solid rgba(45,114,210,0.9)"
                : isCurrentColor
                  ? "2px solid rgba(30,150,60,0.9)"
                  : isLastUsed
                    ? "2px dashed rgba(0,0,0,0.5)"
                    : bgColor === "#000000"
                      ? "1px solid #666"
                      : "1px solid rgba(0,0,0,0.15)",
            },
            onClick: () => this.applyColor(key),
            title:
              c.name +
              (isLight ? "" : " dark") +
              " (" +
              (isLight ? c.key : "Shift+" + c.key) +
              ")",
            tabIndex: -1,
            ref: (el) => {
              this.swatchRefs[rowIndex][col] = el;
            },
            onFocus: () =>
              this.setState({
                focusedCell: { row: rowIndex, col },
                focusedFmt: null,
              }),
          },
          // Letter label
          React.createElement(
            "span",
            {
              className: "cl-swatch-label",
              style: { color: finalLabelColor },
            },
            rowIndex === 0 ? c.key : c.key.toUpperCase(),
          ),
        );
      });

    const lightVariants = colorPalette.map((c) => ({
      color: c,
      key: c.key,
      bg: c.light,
    }));
    const darkVariants = colorPalette.map((c) => ({
      color: c,
      key: c.key.toUpperCase(),
      bg: c.dark,
    }));
    // currentColorKeysForMarkup contains lowercase keys for light and uppercase for dark variants

    return React.createElement(
      "div",
      {
        className: "cl-color-popover",
        style: {
          position: "fixed",
          top: pos.top + "px",
          left: pos.left + "px",
          zIndex: 10000,
        },
        tabIndex: -1,
        ref: (el) => {
          this.containerRef = el;
        },
        onMouseDown: (e) => {
          e.stopPropagation();
          e.preventDefault();
        },
      },
      // Help dialog (rendered inside the popover as an overlay)
      this.state.showHelp &&
        React.createElement(HelpDialog, {
          onClose: () => this.setState({ showHelp: false }),
        }),
      // Header
      React.createElement(
        "div",
        { className: "cl-popover-header" },
        React.createElement(
          "span",
          { className: "cl-popover-title" },
          changeMode ? "Change Color" : "Color Highlighter",
        ),
        React.createElement(
          "div",
          { className: "cl-popover-header-actions" },
          React.createElement(
            "button",
            {
              className: "bp3-button bp3-minimal bp3-small cl-help-btn",
              onClick: () => this.setState((s) => ({ showHelp: !s.showHelp })),
              title: "Help & shortcuts",
              tabIndex: -1,
            },
            "?",
          ),
          React.createElement(
            "button",
            {
              className: "bp3-button bp3-minimal bp3-small",
              onClick: () => this.close(),
              tabIndex: -1,
            },
            React.createElement("span", {
              className: "bp3-icon bp3-icon-cross",
            }),
          ),
        ),
      ),
      // Format selector + children toggle
      React.createElement(
        "div",
        { className: "cl-format-row-wrap" },
        React.createElement(
          "div",
          { className: "bp3-button-group bp3-minimal cl-format-row" },
          ...formatButtons,
        ),
        showChildrenToggle &&
          React.createElement(
            "button",
            {
              className:
                "bp3-button bp3-small bp3-minimal cl-children-toggle" +
                (withChildren ? " bp3-active bp3-intent-primary" : ""),
              onClick: () => this.toggleChildren(),
              title: withChildren
                ? "Block + children (click to apply to block only)"
                : "Block only (click to include children)",
              tabIndex: -1,
            },
            React.createElement("span", {
              className: "bp3-icon bp3-icon-layout-hierarchy",
            }),
            React.createElement(
              "span",
              { className: "cl-fmt-shortcut" },
              String(formatTypes.length + 1),
            ),
          ),
      ),
      // Change mode warning (shown when selected format has no matching blocks)
      showMixedWarning &&
        React.createElement(
          "div",
          { className: "cl-change-mode-warning" },
          React.createElement("span", {
            className: "bp3-icon bp3-icon-warning-sign",
          }),
          " No selected blocks use this format",
        ),
      // Color grid
      React.createElement(
        "div",
        { className: "cl-color-grid" },
        React.createElement(
          "div",
          { className: "cl-color-row cl-color-row-light" },
          React.createElement("span", { className: "cl-row-label" }, "Light"),
          ...makeRow(0, lightVariants, currentColorKeysForMarkup),
        ),
        React.createElement(
          "div",
          { className: "cl-color-row cl-color-row-dark" },
          React.createElement("span", { className: "cl-row-label" }, "Dark"),
          ...makeRow(1, darkVariants, currentColorKeysForMarkup),
        ),
      ),
      // Hint
      React.createElement(
        "div",
        { className: "cl-popover-hint" },
        "1-6: format  |  7: +children  |  letter: color  |  Shift: dark  |  ↑↓←→: navigate  |  Esc: close",
      ),
    );
  }
}

export function showColorPopover(uid, applyColorFn, selection = {}) {
  const pos = getPopoverPosition(selection.selectedUids);
  const portal = createPopoverPortal();

  ReactDOM.render(
    React.createElement(ColorPopover, {
      uid: uid,
      position: pos,
      onApplyColor: applyColorFn,
      selStart: selection.selStart ?? null,
      selEnd: selection.selEnd ?? null,
      selectedUids: selection.selectedUids ?? null,
      changeMode: selection.changeMode ?? false,
      presentMarkups: selection.presentMarkups ?? [],
      isSingleMarkupType: selection.isSingleMarkupType ?? true,
      currentColorKeys: selection.currentColorKeys ?? {},
    }),
    portal,
  );
}
