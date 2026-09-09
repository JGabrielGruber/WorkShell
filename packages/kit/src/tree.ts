export type TreeNode = { id: string; label: string; children?: TreeNode[] };

export type TreeOpts = {
  nodes: TreeNode[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

function renderNode(node: TreeNode, selectedId: string | null | undefined, depth: number): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "ws-treeitem";
  li.setAttribute("role", "treeitem");
  li.dataset.id = node.id;
  li.setAttribute("aria-selected", node.id === selectedId ? "true" : "false");
  li.setAttribute("aria-level", String(depth + 1));
  li.style.paddingInlineStart = `${8 + depth * 12}px`;
  li.tabIndex = 0;
  li.textContent = node.label;
  return li;
}

function walk(nodes: TreeNode[], selectedId: string | null | undefined, depth: number, into: HTMLElement): void {
  for (const node of nodes) {
    into.append(renderNode(node, selectedId, depth));
    if (node.children?.length) walk(node.children, selectedId, depth + 1, into);
  }
}

export function tree(opts: TreeOpts): HTMLElement {
  const el = document.createElement("ul");
  el.className = "ws-tree";
  el.setAttribute("role", "tree");
  walk(opts.nodes, opts.selectedId, 0, el);
  if (opts.onSelect) {
    el.addEventListener("click", (e) => {
      const item = (e.target as HTMLElement | null)?.closest("[data-id]");
      const id = item instanceof HTMLElement ? item.dataset.id : undefined;
      if (id) opts.onSelect?.(id);
    });
  }
  return el;
}
