import { CanvasWindow } from "./canvas-window";
export enum SizeTo {
    None = 0,
    Fill = 1,
    Left = 2,
    Top = 3,
    Right = 4,
    Bottom = 5
}
export class AutoScaleWindow extends CanvasWindow {
    public sizeTo: SizeTo = SizeTo.None;
    public resize() {

    }
}