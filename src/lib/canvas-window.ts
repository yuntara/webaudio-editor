
class CanvasWindowDesktop extends CanvasWindow{
    private ctx : CanvasRenderingContext2D;
    private focus:CanvasWindow;
    private focusizer = ["click","mouseDown"];
    constructor(private canvas:HTMLCanvasElement){

        const ctx = canvas.getContext("2d");
         if(!ctx){
             throw new Error("cannot get context");
         }
        super(null,new Area(ctx,0,0,canvas.width,canvas.height));
        this.ctx = ctx;
        this.focus = this;

    }
    public handle(event:string,...args:any[]){
        if(!this.focus || this.focusizer.includes(event)){
            this.focus =(super.handle as any)(event,...args);
        }else{
            if(this.focus){
                this.focus.doEvent(event,...args);
            }
        }
    }

}
interface IDrawable{

}
interface IArea{
    x:number;
    y:number;
    width:number;//#endregion
    height:number;
}
class Area implements IArea,IDrawable{

    constructor(private ctx: CanvasRenderingContext2D,public x:number,public y:number,public width:number,public height :number){


    }
    public offset(area:IArea){
        return new Area(this.ctx,this.x+area.x,this.y+area.y,this.width,this.height);
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
        this.ctx.fillRect(this.x+x,this.y+y,width,height);
    }
    public moveTo(x:number,y:number){
        this.ctx.moveTo(this.x+x,this.y+y);
    }
    public lineTo(x:number,y:number){
       this. ctx.lineTo(this.x+x,this.y+y);
    }
    public includes(x:number,y:number){
        return x>=this.x && x <= this.x+this.width &&
              y >=this.y && y <= this.y+this.height;
    }

    public static from(area : Area){
        let res = new Area(area.ctx,area.x,area.y,area.width,area.height);
        return res;
    }

}
class CanvasWindow implements IArea{

    public area:Area;
    protected children:CanvasWindow[]=[];
    protected handlers:{[event:string]:(...args:any[])=>void};

    private * getParents(){
        let parent = this.parent;
        while(parent){
            yield parent;
            parent = parent.parent;
        }
    }
    constructor(protected parent:CanvasWindow|null,area?:Area){
        this.handlers = {};
        if(parent){
          this.area = Area.from(parent.area);

          parent.addChild(this);
        }else if(area){
           this.area = area;
        }else{
            throw new Error("no context provided");
        }
    }
    public addChild(child:CanvasWindow){
        this.children.push(child);

    }
    public addHandler(event:string,handler:(...args:any[])=>any){
        this.handlers[event] = handler;
    }
    public doEvent(event:string,...args:any[]){
        return this.handlers[event](...args);
    }
    public handle(event :string,x:number,y:number,...args:any[]):CanvasWindow{
        let child = this.getChildByArea(x,y);
        if(child === null){
            if(event in this.handlers){
                this.doEvent(event,x,y,...args);
            }
            return this;
        }else{
          return child.handle(event,x - child.area.x,y-child.area.y,...args);

        }

    }

    protected getChildByArea(x:number,y:number){
        for(let child of this.children.reverse()){
            if(child.area.includes(x,y)){
                return child;
            }
        }
        return null;
    }
    render(area:IArea&IDrawable){
        for(let child of this.children){
            child.render(child.area.offset(area));
        }
    }
}