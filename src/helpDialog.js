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

  const sections = [
    {
      title: "Open the toolbar",
      rows: [
        [
          "Ctrl+Alt+h",
          "Hotkey for Toolbar command, apply to cursor position or text selection or blocks multiselect",
        ],
        ["/color", "Slash command inside a block"],
        ["Right-click block(s)", "Block / multiselect context menu (bulk)"],
      ],
    },
    {
      title: "Inside the toolbar",
      rows: [
        ["1–6", "Select format"],
        ["7", "Toggle block only / block + children"],
        [
          "b f g o s r t y w",
          "Apply light color or dark variant (Shift + letter)",
        ],
        ["Ctrl/Cmd+click bg/box btn", "Apply background + box simultaneously"],
        ["Enter", "Re-apply last used color"],
      ],
    },
    {
      title:
        "Other commands (command palette or block/multiselect context menu)",
      rows: [
        [
          "Remove color tags",
          "Strip all color tags from current/selected block",
        ],
        [
          "Change color of highlights",
          "Replace existing colors by the selected one",
        ],
      ],
    },
  ];

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
        "Color Highlighter — Shortcuts",
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
    // Sections
    ...sections.map((sec) =>
      React.createElement(
        "div",
        { key: sec.title, className: "cl-help-section" },
        React.createElement(
          "div",
          { className: "cl-help-section-title" },
          sec.title,
        ),
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
                React.createElement(
                  "td",
                  { className: "cl-help-kbd" },
                  React.createElement("kbd", null, kbd),
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
