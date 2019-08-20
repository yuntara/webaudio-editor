import {AutoScaleWindow} from "./autoscale-window";

class Button extends AutoScaleWindow{
    private init(){
        this.handlers["mouseDown"] = this.mouseDown.bind(this);
        this.handlers["mouseUp"] = this.mouseUp.bind(this);
    }
    public click(callback:()=>void){

    }
    private mouseDown(){

    }
    private mouseUp(){

    }
}