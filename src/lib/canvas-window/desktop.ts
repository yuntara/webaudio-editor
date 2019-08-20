import { Area, CanvasWindow } from "./canvas-window";

const throws = (e: any) => {
    throw e;
}
type Focusizer = "click" | "mouseDown";

export class Desktop extends CanvasWindow {
    private ctx: CanvasRenderingContext2D;
    private focus: CanvasWindow;


    constructor(private canvas: HTMLCanvasElement) {

        super(null, new Area(canvas.getContext("2d") || throws("cannot get context"), 0, 0, canvas.width, canvas.height));
        this.ctx = this.area.getContext();
        this.focus = this;
        this.handle("")
    }
    public static isFocusizer(event: string): event is Focusizer {
        return event == "click" || event == "mouseDown";
    }

    //public handle(event: Focusizer, x: number, y: number, ...args: any[]): CanvasWindow;
    public handle<T extends string>(event: T, ...args: T extends Focusizer ? [number, number, ...any[]] : any[]): CanvasWindow {
        if (Desktop.isFocusizer(event)) {
            let eventArgs = args as [number, number, ...any[]];
            return this.focus = (super.handle)(event, ...eventArgs);
        } else {
            if (this.focus) {
                this.focus.doEvent(event, ...args);
                return this.focus;
            } else {
                throw new Error("there is no focused window");
            }
        }
    }

}
