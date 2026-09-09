export class UrlHistory {
  entries: string[];
  index: number;

  constructor(initial: string) {
    this.entries = [initial];
    this.index = 0;
  }

  get current(): string {
    return this.entries[this.index]!;
  }

  push(href: string): void {
    this.entries = this.entries.slice(0, this.index + 1);
    this.entries.push(href);
    this.index = this.entries.length - 1;
  }

  back(): string | null {
    if (this.index <= 0) return null;
    this.index -= 1;
    return this.current;
  }

  forward(): string | null {
    if (this.index >= this.entries.length - 1) return null;
    this.index += 1;
    return this.current;
  }
}
