type MonitorKind = "variable" | "list";

function createMonitorElement(kind: MonitorKind): HTMLDivElement {
  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.padding = "4px 6px";
  el.style.background = "rgba(255,255,255,0.85)";
  el.style.border = "1px solid rgba(0,0,0,0.15)";
  el.style.borderRadius = "6px";
  el.style.whiteSpace = "pre";
  el.style.display = "none";
  if (kind === "list") {
    el.style.maxWidth = "220px";
  }
  return el;
}

export class MonitorOverlay {
  private root: HTMLDivElement;
  private variableMonitors: Map<string, HTMLDivElement> = new Map();
  private listMonitors: Map<string, HTMLDivElement> = new Map();
  private monitorOrder: string[] = [];

  constructor(containerEl: HTMLDivElement) {
    containerEl.style.position = containerEl.style.position || "relative";

    this.root = document.createElement("div");
    this.root.style.position = "absolute";
    this.root.style.left = "0";
    this.root.style.top = "0";
    this.root.style.width = "100%";
    this.root.style.height = "100%";
    this.root.style.zIndex = "9999";
    this.root.style.pointerEvents = "none";
    this.root.style.fontFamily =
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    this.root.style.fontSize = "12px";
    this.root.style.color = "#111";

    containerEl.appendChild(this.root);
  }

  private layout() {
    let y = 6;
    for (const key of this.monitorOrder) {
      const el = this.variableMonitors.get(key) ?? this.listMonitors.get(key);
      if (!el || el.style.display === "none") continue;
      el.style.left = "6px";
      el.style.top = `${y}px`;
      y += el.getBoundingClientRect().height + 6;
    }
  }

  private ensure(kind: MonitorKind, name: string): HTMLDivElement {
    const map = kind === "variable" ? this.variableMonitors : this.listMonitors;
    const existing = map.get(name);
    if (existing) return existing;

    const el = createMonitorElement(kind);
    this.root.appendChild(el);
    map.set(name, el);
    this.monitorOrder.push(name);
    return el;
  }

  showVariable(name: string) {
    const el = this.ensure("variable", name);
    el.style.display = "block";
    this.layout();
  }

  hideVariable(name: string) {
    const el = this.variableMonitors.get(name);
    if (!el) return;
    el.style.display = "none";
    this.layout();
  }

  renderVariable(name: string, value: unknown) {
    const el = this.ensure("variable", name);
    el.style.display = "block";
    el.textContent = `${name}: ${String(value)}`;
    this.layout();
  }

  showList(name: string) {
    const el = this.ensure("list", name);
    el.style.display = "block";
    this.layout();
  }

  hideList(name: string) {
    const el = this.listMonitors.get(name);
    if (!el) return;
    el.style.display = "none";
    this.layout();
  }

  renderList(name: string, value: unknown) {
    const el = this.ensure("list", name);
    el.style.display = "block";

    if (Array.isArray(value)) {
      el.textContent = `${name}:\n${value.map((v) => String(v)).join("\n")}`;
    } else {
      el.textContent = `${name}: ${String(value)}`;
    }
    this.layout();
  }
}

