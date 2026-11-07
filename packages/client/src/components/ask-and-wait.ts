export class AskAndWaitComponent {
  private root: HTMLDivElement;
  private question: HTMLDivElement;
  private input: HTMLInputElement;
  private queue: Promise<void> = Promise.resolve();
  answer = "";

  constructor(container: HTMLDivElement) {
    this.root = document.createElement("div");
    Object.assign(this.root.style, {
      position: "absolute",
      inset: "0",
      zIndex: "10000",
      display: "none",
      alignItems: "flex-end",
      justifyContent: "center",
      padding: "12px",
      boxSizing: "border-box",
      pointerEvents: "none",
      fontFamily: "Arial, sans-serif",
    });

    const form = document.createElement("form");
    Object.assign(form.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      width: "100%",
      maxWidth: "440px",
      padding: "10px",
      borderRadius: "8px",
      background: "#ffffff",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
      pointerEvents: "auto",
    });

    this.question = document.createElement("div");
    Object.assign(this.question.style, {
      flex: "0 1 auto",
      overflowWrap: "anywhere",
      fontSize: "14px",
      color: "#222",
    });

    this.input = document.createElement("input");
    this.input.type = "text";
    this.input.setAttribute("aria-label", "Your answer");
    Object.assign(this.input.style, {
      flex: "1 1 auto",
      minWidth: "0",
      padding: "7px 9px",
      border: "1px solid #aaa",
      borderRadius: "5px",
      font: "inherit",
    });

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "OK";
    Object.assign(submit.style, {
      padding: "7px 12px",
      border: "0",
      borderRadius: "5px",
      background: "#4c97ff",
      color: "#fff",
      font: "inherit",
      cursor: "pointer",
    });

    form.append(this.question, this.input, submit);
    this.root.appendChild(form);
    container.appendChild(this.root);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.answer = this.input.value;
      this.root.style.display = "none";
      this.resolveCurrent?.(this.answer);
      this.resolveCurrent = null;
    });
  }

  private resolveCurrent: ((answer: string) => void) | null = null;

  askAndWait(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.queue = this.queue.then(
        () =>
          new Promise<void>((complete) => {
            this.question.textContent = question;
            this.input.value = "";
            this.resolveCurrent = (answer) => {
              resolve(answer);
              complete();
            };
            this.root.style.display = "flex";
            this.input.focus();
          }),
      );
    });
  }
}
