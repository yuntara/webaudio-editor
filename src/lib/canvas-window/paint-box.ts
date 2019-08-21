import { AutoScaleWindow } from "./autoscale-window";


export class PaintBox extends AutoScaleWindow {

    get ctx() {
        return this.area;
    }
}