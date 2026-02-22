export const colorPalette = [
  { name: "blue", key: "b", light: "#cee9ff", dark: "#0254a0" },
  { name: "fuchsia", key: "f", light: "#ffa0ea", dark: "#f012be" },
  { name: "green", key: "g", light: "#d3f8d5", dark: "#439946" },
  { name: "orange", key: "o", light: "#ffecd0", dark: "#ff851b" },
  { name: "silver", key: "s", light: "#dddddd", dark: "#aaaaaa" },
  { name: "red", key: "r", light: "#fcb8b8", dark: "#e51000" },
  { name: "teal", key: "t", light: "#39cccc", dark: "#008080" },
  { name: "yellow", key: "y", light: "#fff6b9", dark: "#ffdc00" },
  { name: "black", key: "w", light: "#000000", dark: "#000000" },
];

export const formatTypes = [
  {
    id: "highlight",
    label: "Highlight",
    markup: "^^",
    icon: "highlight",
    shortcut: "1",
  },
  {
    id: "bold",
    label: "Text color",
    markup: "**",
    icon: "bold",
    shortcut: "2",
  },
  {
    id: "underline",
    label: "Underline",
    markup: "__",
    icon: "underline",
    shortcut: "3",
  },
  {
    id: "inline-box",
    label: "Box",
    markup: "~~",
    icon: "text-highlight",
    shortcut: "4",
  },
  {
    id: "bg-block",
    label: "Background",
    markup: "#.bg-",
    icon: "tint",
    shortcut: "5",
    groupStart: true,
    supportsChildren: true,
  },
  {
    id: "box-block",
    label: "Block box",
    markup: "#.box-",
    icon: "square",
    shortcut: "6",
    supportsChildren: true,
  },
];
