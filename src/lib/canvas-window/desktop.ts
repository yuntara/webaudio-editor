import { Area, CanvasWindow } from "./canvas-window";

const throws = (e: any) => {
    throw e;
}
type Focusizer = "click" | "mousedown";

export class Desktop extends CanvasWindow {
    private ctx: CanvasRenderingContext2D;
    private focus: CanvasWindow;


    constructor(private canvas: HTMLCanvasElement) {

        super(null, new Area(canvas.getContext("2d") || throws("cannot get context"), 0, 0, canvas.width, canvas.height));
        this.ctx = this.area.getContext();
        this.focus = this;
        this.registerEvent();
    }
    set cursor(cursor: string) {
        this.canvas.style.cursor = cursor;
    }
    get cursor() {
        return this.canvas.style.cursor;
    }
    public static isFocusizer(event: string): event is Focusizer {
        return event == "click" || event == "mousedown";
    }
    private registerEvent() {
        ["click", "mousedown", "mouseup", "mousemove"].forEach(event => {
            this.canvas.addEventListener(event, this.mouseEvent.bind(this, event));

        });
    }
    private mouseEvent(event: string, e: MouseEvent) {
        if (event == "mousemove") {
            if (this.thinOut()) { return; }
        }

        const x = e.offsetX;
        const y = e.offsetY;
        //console.log("event:", event, x, y);
        this.handle(event, x, y, e.buttons);
    }

    //public handle(event: Focusizer, x: number, y: number, ...args: any[]): CanvasWindow;
    public handle<T extends string>(event: T, ...args: T extends Focusizer ? [number, number, ...any[]] : any[]): CanvasWindow {
        if (Desktop.isFocusizer(event) || (event == "mousemove" && args[2] == 0)) {
            let eventArgs = args as [number, number, ...any[]];
            return this.focus = (super.handle)(event, ...eventArgs);
        } else {
            if (this.focus) {
                if (event == "mouseup") {
                    const x = args.shift();
                    const y = args.shift();
                    this.focus.doEvent(event, x - this.focus.area.x, y - this.focus.area.y, ...args);
                } else {
                    this.focus.doEvent(event, ...args);
                }
                return this.focus;
            } else {
                throw new Error("there is no focused window");
            }
        }
    }

}
