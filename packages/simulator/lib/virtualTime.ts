export class VirtualTime {
  private scale: number;
  private offset: number;
  private paused: boolean;
  private pausedTime: number;

  constructor(scale: number) {
    this.scale = scale;
    this.offset = Date.now();
    this.paused = false;
    this.pausedTime = 0;
  }

  time(): number {
    if (this.paused) {
      return this.pausedTime;
    }
    return (Date.now() - this.offset) * this.scale;
  }

  pause(): void {
    if (!this.paused) {
      this.pausedTime = this.time();
      this.paused = true;
    }
  }

  play(): void {
    if (this.paused) {
      this.offset = Date.now() - this.pausedTime / this.scale;
      this.paused = false;
    }
  }
}
