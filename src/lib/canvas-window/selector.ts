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
export class Selector extends AutoScaleWindow {
    private range_: Range | null = null;
    public min: number = 0;
    public max: number = 100;
    private mouseState: MouseState = MouseState.up;
    private dragState: DragState | null = null;
    init() {
        this.area.height = 30;
        this.handlers["mousedown"] = this.mousedown.bind(this);
        this.handlers["mouseup"] = this.mouseup.bind(this);
        this.handlers["mousemove"] = this.mousemove.bind(this);

        this.render();
    }
    getRangeArea() {
        if (this.range_) {
            const startx = (this.area.width) * (this.range_.start - this.min) / (this.max - this.min);
            const endx = (this.area.width) * (this.range_.end - this.min) / (this.max - this.min);

            return new Rect(startx, 0, Math.max(0, endx - startx), this.area.height);
        } else {
            return null;
        }
    }
    mousedown(x: number, y: number) {
        this.dragState = { pos: x, start: this.min, end: this.max };
        this.mouseState = MouseState.down;
    }

    toRange(x: number) {
        return (this.max - this.min) * (x) / (this.area.width);
    }
    mousemove(x: number, y: number) {
        if (this.dragState && this.mouseState == MouseState.down) {

            this.range_ = {
                start: this.min + this.toRange(this.dragState.pos),
                end: this.min + this.toRange(x)
            }
            if (this.range_.start > this.range_.end) {
                let tmp = this.range_.end;
                this.range_.end = this.range_.start;
                this.range_.start = tmp;
            }
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
        this.mousemove(x, y);
        if (this.range && this.range.start == this.range.end) {
            this.range = null;
            this.doChange();
        }
        this.mouseState = MouseState.up;

    }
    get range(): Range | null {
        if (this.range_) {
            return {
                start: Math.round(this.range_.start),
                end: Math.round(this.range_.end)
            }
        } else {
            return null;
        }
    }
    set range(range: Range | null) {
        this.range_ = range;
        this.render();
    }
    render() {
        /*
        this.area.clear();
    
        const rangeArea = this.getRangeArea();
        if (rangeArea) {
            this.area.fillStyle = "rgba(168,168,168,0.5)";
            this.area.fillRect(rangeArea.x, rangeArea.y, rangeArea.width, rangeArea.height);
        }*/

    }
}