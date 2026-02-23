import React from "react";
import ReactDOM from "react-dom";

let helpPortal = null;

export function destroyHelpPortal() {
  if (helpPortal) {
    ReactDOM.unmountComponentAtNode(helpPortal);
    helpPortal.remove();
    helpPortal = null;
  }
}

export function showHelpDialog() {
  if (helpPortal) {
    destroyHelpPortal();
    return;
  }
  helpPortal = document.createElement("div");
  helpPortal.id = "cl-help-portal";
  document.body.appendChild(helpPortal);
  ReactDOM.render(
    React.createElement(HelpDialog, { onClose: destroyHelpPortal }),
    helpPortal,
  );
}

function kbd(key) {
  return React.createElement("kbd", null, key);
}

function HelpDialog({ onClose }) {
  const handleKeyDown = React.useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  return React.createElement(
    "div",
    {
      className: "cl-help-dialog",
      onMouseDown: (e) => {
        e.stopPropagation();
        e.preventDefault();
      },
    },
    // Header
    React.createElement(
      "div",
      { className: "cl-help-header" },
      React.createElement(
        "span",
        { className: "cl-help-title" },
        "Color Highlighter — Help",
      ),
      React.createElement(
        "button",
        {
          className: "bp3-button bp3-minimal bp3-small",
          onClick: onClose,
          tabIndex: -1,
        },
        React.createElement("span", { className: "bp3-icon bp3-icon-cross" }),
      ),
    ),

    // Open the toolbar
    React.createElement(
      "div",
      { className: "cl-help-section" },
      React.createElement(
        "div",
        { className: "cl-help-section-title" },
        "Open the toolbar",
      ),
      React.createElement(
        "div",
        { className: "cl-help-row" },
        React.createElement(
          "div",
          { className: "cl-help-kbd-col" },
          kbd("Ctrl+Alt+h"),
        ),
        React.createElement(
          "div",
          { className: "cl-help-desc-col" },
          "Main hotkey — opens the toolbar on the current cursor position, a text selection, or a block multiselect",
        ),
      ),
      React.createElement(
        "p",
        { className: "cl-help-text" },
        "Also available via the ",
        kbd("/color"),
        " slash command inside a block.",
      ),
      React.createElement(
        "p",
        { className: "cl-help-text" },
        "Once the Toolbar is focused (with Tab when using native format hotkeys) all can be done with Keyboard-only with numbers, letters, Space to select, Enter to apply last color.",
      ),
    ),

    // Right-click to change format/color
    React.createElement(
      "div",
      { className: "cl-help-section" },
      React.createElement(
        "div",
        { className: "cl-help-section-title" },
        "Change or remove color",
      ),
      React.createElement(
        "p",
        { className: "cl-help-text" },
        React.createElement(
          "strong",
          null,
          "Right-click on any colored/formatted element",
        ),
        " in Roam to change its color or format directly. You can also press Toolbar command/hotkeys when cursor is in a format tag/content to edit it.",
      ),
    ),

    // Multiselect / bulk
    React.createElement(
      "div",
      { className: "cl-help-section" },
      React.createElement(
        "div",
        { className: "cl-help-section-title" },
        "Multiselect & bulk processing",
      ),
      React.createElement(
        "p",
        { className: "cl-help-text" },
        "Select multiple blocks in Roam (",
        kbd("Shift+click"),
        " or ",
        kbd("Shift+↑/↓"),
        "), then open the toolbar with ",
        kbd("Ctrl+Alt+h"),
        " or right-click to access the block context menu. All color and remove-color commands apply to the whole selection at once.",
      ),
    ),

    // Card grid
    React.createElement(
      "div",
      { className: "cl-help-section" },
      React.createElement(
        "div",
        { className: "cl-help-section-title" },
        "Card grid (experimental — not in toolbar)",
      ),
      React.createElement(
        "p",
        { className: "cl-help-text" },
        "Add one of the following tags to a ",
        React.createElement("strong", null, "parent block"),
        " to display its children as a card grid (min 300px each):",
      ),
      React.createElement(
        "ul",
        { className: "cl-help-list" },
        React.createElement("li", null, kbd("#.card-grid"), " — basic grid"),
        React.createElement(
          "li",
          null,
          kbd("#.card-grid-light"),
          " / ",
          kbd("#.card-grid-dark"),
          " — themed variant",
        ),
        React.createElement(
          "li",
          null,
          kbd("#.card-grid-color"),
          " (e.g. ",
          kbd("#.card-grid-blue"),
          ") — colored cards with matching title",
        ),
      ),
    ),

    // Support
    React.createElement("div", { className: "cl-help-divider" }),
    React.createElement(
      "div",
      { className: "cl-help-support" },
      React.createElement("strong", null, "How to support my work?"),
      React.createElement("br"),
      "Become a ",
      React.createElement(
        "a",
        {
          href: "https://github.com/sponsors/fbgallet",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        "Github sponsor",
      ),
      ", ",
      React.createElement(
        "a",
        {
          href: "https://buymeacoffee.com/fbgallet",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        "buy me a coffee",
      ),
      " or follow @fbgallet on ",
      React.createElement(
        "a",
        {
          href: "https://x.com/fbgallet",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        "X",
      ),
      ", on ",
      React.createElement(
        "a",
        {
          href: "https://bsky.app/profile/fbgallet.bsky.social",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        "Bluesky",
      ),
      " or on ",
      React.createElement(
        "a",
        {
          href: "https://mastodon.social/@fbgallet",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        "Mastodon",
      ),
      ".",
    ),
  );
}
