import { AutoScaleWindow } from "./autoscale-window";
import { Rect } from "./canvas-window";
export interface Range {
    start: number;
    end: number;
}
enum MouseState {
    down = 1,
    up = 0
}
interface DragState {
    pos: number;
    start: number;
    end: number;
}
export class RangeBar extends AutoScaleWindow {
    private range_: Range = { start: 0, end: 10 };
    public min: number = 0;
    public max: number = 100;
    private mouseState: MouseState = MouseState.up;
    private dragState: DragState | null = null;
    init() {
        this.area.height = 30;
        this.range_ = { start: 0, end: 100 };
        this.handlers["mousedown"] = this.mousedown.bind(this);
        this.handlers["mouseup"] = this.mouseup.bind(this);
        this.handlers["mousemove"] = this.mousemove.bind(this);

        this.render();
    }
    getRangeArea() {
        const startx = (this.area.width - 64) * (this.range_.start - this.min) / (this.max - this.min);
        const endx = (this.area.width - 64) * (this.range_.end - this.min) / (this.max - this.min);

        return new Rect(32 + startx, 0, Math.max(10, endx - startx), this.area.height);
    }
    mousedown(x: number, y: number) {
        const rangeArea = this.getRangeArea();
        if (rangeArea.includes(x, y)) {

            this.rangeDown(x, y);
        }
    }
    rangeDown(x: number, y: number) {
        this.dragState = { pos: x, start: this.range_.start, end: this.range_.end };
        this.mouseState = MouseState.down;
    }
    toRange(x: number) {
        return (this.max - this.min) * (x) / (this.area.width - 64);
    }
    mousemove(x: number, y: number) {
        if (this.dragState && this.mouseState == MouseState.down) {

            console.log("move", x, y);
            this.range_.start = this.dragState.start + this.toRange((x - this.dragState.pos));
            this.range_.end = this.dragState.end + this.toRange((x - this.dragState.pos));
            this.render();
            this.doChange();
        }
    }
    doChange() {
        if (this.handlers["onchange"]) {
            this.handlers["onchange"]();
        }
    }
    change(handler: () => {}) {
        this.handlers["onchange"] = handler;
    }
    mouseup(x: number, y: number) {
        console.log("up", x, y);
        this.mouseState = MouseState.up;
    }
    get range() {
        return {
            start: Math.round(this.range_.start),
            end: Math.round(this.range_.end)
        }
    }
    set range(range: Range) {
        this.range_ = range;
        this.render();
    }
    render() {
        this.area.clear();
        this.area.fillStyle = "rgb(128,128,128)";
        this.area.fillRect(0, 0, 30, this.area.height);
        const rangeArea = this.getRangeArea();

        this.area.fillStyle = "rgb(168,168,168)";
        this.area.fillRect(rangeArea.x, rangeArea.y, rangeArea.width, rangeArea.height);

        this.area.fillStyle = "rgb(128,128,128)";
        this.area.fillRect(this.area.width - 30, 0, this.area.width, this.area.height);

    }
}