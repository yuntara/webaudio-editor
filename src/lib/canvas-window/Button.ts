import { AutoScaleWindow } from "./autoscale-window";

export class Button extends AutoScaleWindow {
    public text_: string = "";
    public init() {
        this.handlers["mouseDown"] = this.mouseDown.bind(this);
        this.handlers["mouseUp"] = this.mouseUp.bind(this);
    }
    public set text(text: string) {
        this.text_ = text;
        this.render();
    }
    public get text() {
        return this.text_;
    }
    public click(callback: () => void) {

    }
    public render() {
        this.area.clear();
        this.area.fillText(this.text_, 3, 3, this.area.width);
    }
    private mouseDown() {

    }
    private mouseUp() {

    }
}