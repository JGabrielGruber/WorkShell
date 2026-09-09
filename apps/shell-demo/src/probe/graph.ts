import type { TreeNode } from "@workshell/kit";

export const probeTree: TreeNode[] = [
  {
    id: "/",
    label: "Probe",
    children: [
      { id: "/fields", label: "Fields" },
      { id: "/tabs", label: "Tabs" },
      { id: "/list", label: "List" },
      { id: "/dialog", label: "Dialog" },
    ],
  },
];

export const probeIcons = [
  { id: "/fields", label: "Fields", group: "Kit" },
  { id: "/tabs", label: "Tabs", group: "Kit" },
  { id: "/list", label: "List", group: "Kit" },
  { id: "/dialog", label: "Dialog", group: "Kit" },
];
