
interface IDrawable {

}
interface IArea {
    x: number;
    y: number;
    width: number;//#endregion
    height: number;
}
export class Rect implements IArea {
    constructor(public x: number, public y: number, public width: number, public height: number) {

    }
    public set(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    public includes(x: number, y: number) {
        return x >= this.x && x <= this.x + this.width &&
            y >= this.y && y <= this.y + this.height;
    }
}
export class Area extends Rect implements IArea, IDrawable {

    constructor(private ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
        super(x, y, width, height);
        this.init();
    }
    protected init() {

    }
    public offset(area: IArea) {
        return new Area(this.ctx, this.x + area.x, this.y + area.y, this.width, this.height);
    }
    public getContext() {
        return this.ctx;
    }

    set fillStyle(fillStyle: string) {
        this.ctx.fillStyle = fillStyle
    }
    set strokeStyle(strokeStyle: string) {
        this.ctx.strokeStyle = strokeStyle;
    }
    set lineWidth(lineWidth: number) {
        this.ctx.lineWidth = lineWidth;
    }
    public clear() {
        this.fillStyle = "rgb(255,255,255)";
        this.fillRect(0, 0, this.width, this.height);
    }
    public fillRect(x: number, y: number, width: number, height: number) {
        this.ctx.fillRect(this.x + x, this.y + y, width, height);
    }
    public beginPath() {
        this.ctx.beginPath();
    }
    public closePath() {
        this.ctx.closePath();
    }
    public stroke() {
        this.ctx.stroke();
    }
    //context.font = "30px 'ＭＳ ゴシック'";
    //context.textAlign = "left";
    //context.textBaseline = "top";
    public set font(font: string) {
        this.ctx.font = font;
    }
    public set textAlign(align: CanvasTextAlign) {
        this.ctx.textAlign = align;
    }
    public fillText(text: string, x: number, y: number, maxWidth?: number | undefined) {
        this.ctx.fillText(text, this.x + x, this.y + y, maxWidth);
    }
    public set textBaseline(baseline: CanvasTextBaseline) {
        this.ctx.textBaseline = baseline;
    }
    public moveTo(x: number, y: number) {
        this.ctx.moveTo(this.x + x, this.y + y);
    }
    public lineTo(x: number, y: number) {
        this.ctx.lineTo(this.x + x, this.y + y);
    }


    public static from(area: Area) {
        let res = new Area(area.ctx, area.x, area.y, area.width, area.height);
        return res;
    }

}

export class CanvasWindow {

    public area: Area;
    protected children: CanvasWindow[] = [];
    protected handlers: { [event: string]: (...args: any[]) => void };

    private lastTime: Date = new Date();
    private * getParents() {
        let parent = this.parent;
        while (parent) {
            yield parent;
            parent = parent.parent;
        }
    }

    constructor(protected parent: CanvasWindow | null, area?: Area) {
        this.handlers = {};
        if (parent) {
            this.area = Area.from(parent.area);

            parent.addChild(this);
        } else if (area) {
            this.area = area;
        } else {
            throw new Error("no context provided");
        }
        this.init();
    }
    public init() {

    }
    public addChild(child: CanvasWindow) {
        this.children.push(child);

    }
    public addHandler(event: string, handler: (...args: any[]) => any) {
        this.handlers[event] = handler;
    }
    public doEvent(event: string, ...args: any[]) {
        return this.handlers[event] && this.handlers[event](...args);
    }
    thinOut() {
        const now = new Date();
        if (this.lastTime.getTime() - now.getTime() < 1000) {
            this.lastTime = now;
            return false;
        } else {
            return true;
        }
    }
    public handle(event: string, x: number, y: number, ...args: any[]): CanvasWindow {
        let child = this.getChildByArea(x, y);
        if (child === null) {
            if (event in this.handlers) {
                this.doEvent(event, x, y, ...args);
            }
            return this;
        } else {
            return child.handle(event, x - child.area.x, y - child.area.y, ...args);

        }

    }

    protected getChildByArea(x: number, y: number) {
        for (let child of this.children.reverse()) {
            if (child.area.includes(x, y)) {
                return child;
            }
        }
        return null;
    }
    render() {//area: IArea & IDrawable) {
        this.area.clear();
        for (let child of this.children) {
            child.render();//child.area.offset(area));
        }
    }
}

