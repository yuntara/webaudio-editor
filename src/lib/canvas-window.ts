
class CanvasWindowDesktop extends CanvasWindow{
    private ctx;
    private focus:CanvasWindow;
    private focusizer = ["click","mouseDown"];
    constructor(private canvas:HTMLCanvasElement){
        this.ctx = canvas.getContext("2d");
        this.area = new Area(0,0,canvas.width,canvas.height);
        this.parent = null;
    }
    handle(event,...args){
        if(!focus || focusizer.includes(event)){
            super.handle(event,...args);
        }else{
            if(focus){
                focus.handle(event,...args);
            }
        }
    }
    
}
interface IDrawable{
    
}
interface IArea{
    x:number;
    y:number;
    width:number;
    height:number;
}
class Area implements IArea,IDrawable{
    
    constructor(private ctx CanvasRenderingContext2D,public x:number,public y:number,public width:number,public height number){
        
        
    }
    public offset(area:IArea){
        return new Area(this.x+area.x,this.y+area.y,this.width,this.height);
    }
    set fillStyle(fillStyle:string){
        this.ctx.fillStyle = fillStyle
    }
    set StrokeStyle(strokeStyle:string){
        this.ctx.strokeStyle = strokeStyle;
    }
    set lineWidth(lineWidth:number){
        this.ctx.lineWidth = lineWidth;
    }
    public fillRect(x:number,y:number,width:number,height:number){
        this.ctx.fillRect(this.x+x,this.y+y,width,number);
    }
    public moveTo(x:number,y:number){
        this.ctx.moveTo(this.x+x,this.y+y);
    }
    public lineTo(x:number,y:number){
       this. ctx.lineTo(this.x+x,this.y+y);
    }
    
}
class CanvasWindow implements IArea{
    
    public area:Area;
    protected children:CanvasWindow[]=[];
    protected handlers;
    public handleArgResolver = {
        
    }
    public handlePosition(x,y,...args){
        for (let parent of this.getParents()){
            
        }
    }
    private *getParents(){
        let parent = this.parent;
        while
    }
    constructor(protected parent:CanvasWindow){
        this.area = new Area(parent.area);
        parent.addChild(this);
    }
    public addChild(child:CanvasWindow){
        this.children.push(child);
        
    }
    addHandler(event,handler){
        this.handlers[event] = handler;
    }
    handle(event :string,...args){
        let child = getChildByArea(x,y);
        if(child === null){
            if(event in this.handlers){
                this.handlers[event](this.resolveHandleArg(event,...args));
            }
            return this;
        }else{
          return child.handle(event,...args);
          
        }
        
    }
    resolveHandleArg(...args){
        
    }
    getChildByArea(x:number,y:number){
        for(let child of this.children.reverse()){
            if(child.area.includes(x,y)){
                return child;
            }
        }
        return null;
    }
    render(area:IArea){
        for(let child of children){
            child.render(child.area.offset(area));
        }
    }
}