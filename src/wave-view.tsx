/* reactとreact-domの読み込み */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as file from "./lib/file";
import Audio from "./lib/audio";
import { Desktop } from './lib/canvas-window/desktop';
import { PaintBox } from './lib/canvas-window/paint-box';
import { RangeBar } from "./lib/canvas-window/range-bar";
import { Selector } from './lib/canvas-window/selector';
declare function require(x: string): any;
import * as fft from "fft-js";

export type ViewMode = null | undefined | "" | "sqrt" | "normalize" | "spectrum" | "spectrum-color";
/** Helloコンポーネントで取得するpropsの型定義 */
export interface WaveViewProps {
    source: AudioBuffer | undefined | null;
    width: number;
    height: number;
    audio: Audio | null;
    play: boolean;
    zoom: boolean;
    viewMode?: ViewMode;
    canvasUpdate: boolean;
    onselect?: (range: Range | null) => {};
    onend?: () => {};
}
interface Range {
    start: number;
    end: number;
}
interface SelectedRange extends Range {
    channels: number[];


}
/** Helloコンポーネントのstateの型定義 */
interface WaveViewState {
    range: Range
}
interface PlayState {
    starttime: number;
    playpos: number;
}
/** Helloコンポーネント */
export class WaveView extends React.Component<WaveViewProps, WaveViewState> {
    private canvas: HTMLCanvasElement | null;
    private updated: boolean = true;
    private ctx: CanvasRenderingContext2D | null;
    private desktop: Desktop | null = null;
    private box: PaintBox | null = null;
    private rangeBar: RangeBar | null = null;
    private playing: PlayState | null = null;
    private playInterval: number = 0;
    private audiosource: AudioBufferSourceNode | null = null;
    private requested: boolean = false;
    private selector: Selector | null = null;

    constructor(props: WaveViewProps) {
        super(props);
        this.state = {
            range: {
                start: 0,
                end: 44100 * 10
            }
        };
        this.canvas = null;
        this.ctx = null;
    }
    componentDidMount() {
        this.animate();
    }
    componentDidUpdate(oldProps: WaveViewProps) {

        const newProps = this.props;
        if (oldProps.source !== newProps.source && newProps.source && this.rangeBar && this.selector) {
            this.rangeBar.min = 0;
            this.rangeBar.max = newProps.source.getChannelData(0).length;
            this.rangeBar.range = { start: 0, end: 44100 * 10 };//this.rangeBar.max / 200 };
            this.setState({ ...this.state, range: this.rangeBar.range });

            this.selector.min = this.rangeBar.range.start;
            this.selector.max = this.rangeBar.range.end;

        }
        if (oldProps.zoom != newProps.zoom && this.rangeBar && this.selector && this.canvas) {

            this.rangeBar.range = { start: this.rangeBar.range.start, end: this.rangeBar.range.start + this.canvas.width };
            this.selector.min = this.rangeBar.range.start;
            this.selector.max = this.rangeBar.range.end;
            this.changeRange();

        }
        if (oldProps.viewMode != newProps.viewMode) {
            this.renderCanvas();
        }
        if (oldProps.canvasUpdate != newProps.canvasUpdate) {
            this.renderCanvas();
        }
        if (oldProps.play != newProps.play && this.props.audio && this.props.source && this.rangeBar) {
            if (newProps.play) {
                const startPos = Math.max(0, this.rangeBar.range.start);
                this.audiosource = this.props.audio.play(this.props.source,
                    this.props.audio.getSecond(this.props.source, startPos),
                    undefined,
                    //this.props.audio.getSecond(this.props.source, this.rangeBar.range.end - this.rangeBar.range.start),
                    () => {
                        this.playing = null;
                        if (this.props.onend) {

                            this.props.onend();
                        }
                    }
                );
                this.playing = {
                    starttime: this.props.audio.currentTime(),
                    playpos: startPos
                };
                this.updated = true;
            } else {
                if (this.audiosource) {
                    this.audiosource.stop();
                    this.audiosource = null;
                }
            }


        }
        this.renderCanvas();
    }

    animate() {
        if (this.canvas && this.ctx && this.props.source && this.updated && this.box) {
            const source = this.props.source;
            const channels: Float32Array[] = [0, 1].map(n => source.getChannelData(n));


            //analyser.getByteTimeDomainData(dataArray);
            const ctx = this.box.ctx;
            const { width, height } = ctx;

            ctx.fillStyle = 'rgb(200, 200, 200)';
            ctx.fillRect(0, 0, width, height);

            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgb(0, 0, 0)';

            ctx.beginPath();


            var x = 0;
            const range = this.state.range;
            const channelHeight = height / channels.length;
            let n = 0;
            const span = 1;
            let norm = 0.01;
            if (this.props.viewMode == "normalize") {
                for (let channel of channels) {

                    for (let i = 0; i < width; i++) {

                        var pos = Math.floor(range.start + (range.end - range.start) * (i / width));
                        if (pos >= 0 && pos < channel.length) {
                            let v = 0;
                            for (let j = 0; j < span; j++) {
                                const nv = channel[pos + j - Math.floor(span / width)];
                                if (Math.abs(nv) > Math.abs(v)) {
                                    v = nv;
                                }
                            }
                            if (Math.abs(v) > norm) {
                                norm = Math.abs(v);
                            }
                        }
                    }
                }
            }






            if (this.props.viewMode == "spectrum" || this.props.viewMode == "spectrum-color") {
                n = 0;
                for (let channel of channels) {

                    var pos = Math.floor(range.start);
                    var buffer = channel.subarray(pos, pos + 4096).map((v, i) => {
                        const x = i / 4096;
                        return v * (0.54 - 0.47 * Math.cos(2 * Math.PI * x));
                    });

                    let phaser: number[];
                    if (this.props.viewMode == "spectrum-color") {
                        ctx.fillStyle = "rgb(0,0,0)";
                        ctx.fillRect(0, n * channelHeight, width, channelHeight);
                        phaser = fft.fft(buffer).map(x => {
                            return Math.min(1, Math.max(0,
                                -0.2 + (Math.log(Math.sqrt(x[0] * x[0] + x[1] * x[1]) + 0.001) / Math.log(10)) / 2

                            ));
                        });
                    } else {
                        phaser = fft.fft(buffer).map(x => {
                            return Math.min(1, Math.max(0,
                                -0.2 + (Math.log(Math.sqrt(x[0] * x[0] + x[1] * x[1]) + 0.001) / Math.log(10)) / 3
                            ));
                        });
                    }
                    for (let i = 0; i < 2048; i++) {
                        let v = phaser[i];

                        const x = (Math.log(i + 1) / Math.log(2048)) * width;


                        if (this.props.viewMode == "spectrum-color") {
                            const color = Math.max(0, Math.min(255, Math.floor(255 * (v))));
                            ctx.fillStyle = `rgba(0,0,${color},64)`;

                            //const wid = (Math.log(i + 2) / Math.log(2048)) * width - x;
                            const wid = (Math.log((i + 2) / (i + 1)) / Math.log(2048)) * width;

                            ctx.fillRect(x, n * channelHeight, Math.max(2, wid), channelHeight);

                        } else {
                            v = (n + 1) * channelHeight + (-v * channelHeight);

                            ctx.moveTo(x, (n + 1) * channelHeight);
                            ctx.lineTo(x, v);
                        }

                    }
                    ++n;
                }

            } else {
                for (let channel of channels) {
                    let initialLine = true;

                    for (let i = 0; i < width; i++) {


                        var pos = Math.floor(range.start + (range.end - range.start) * (i / width));
                        if (pos >= 0 && pos < channel.length) {
                            let v = 0;
                            for (let j = 0; j < span; j++) {
                                const nv = channel[pos + j - Math.floor(span / width)];
                                if (Math.abs(nv) > Math.abs(v)) {
                                    v = nv;
                                }
                            }
                            if (this.props.viewMode == "normalize") {
                                v = v / norm;
                            } else if (this.props.viewMode == "sqrt") {
                                if (v > 0) {
                                    v = Math.max(0, Math.sqrt(v));

                                } else if (v < 0) {
                                    v = -Math.max(0, Math.sqrt(-v));
                                } else {
                                    v = 0;
                                }
                            }
                            v = (n + 0.5) * channelHeight + (v * channelHeight / 2);

                            if (initialLine) {
                                ctx.moveTo(i, v);
                                initialLine = false;
                            } else {
                                ctx.lineTo(i, v);
                            }
                        }
                    }
                    ++n;
                }


            }
            ctx.stroke();
            if (this.selector && this.rangeBar && this.selector.range) {
                ctx.fillStyle = "rgba(128,128,128,0.5)";
                const startx = this.rangeBar.range.start;
                const endx = this.rangeBar.range.end;

                const pos_sx = (this.selector.range.start - startx) * ctx.width / (endx - startx);
                const pos_ex = (this.selector.range.end - startx) * ctx.width / (endx - startx);
                ctx.fillRect(pos_sx, 0, pos_ex - pos_sx, ctx.height);
                //console.log("draw selector", pos_sx, pos_ex);
            }
            if (this.rangeBar) {

                if (this.playing && this.props.audio) {
                    const duration = (this.props.source.sampleRate) * (this.props.audio.currentTime() - this.playing.starttime);
                    const startx = this.rangeBar.range.start;
                    const endx = this.rangeBar.range.end;
                    pos = (this.playing.playpos + duration - startx) * ctx.width / (endx - startx);
                    if (pos > ctx.width) {
                        let newRange = this.rangeBar.range;
                        while (pos > ctx.width) {
                            const { start, end } = newRange;
                            newRange.start = end;
                            newRange.end = end + end - start;
                            const startx = newRange.start;
                            const endx = newRange.end;
                            pos = (this.playing.playpos + duration - startx) * ctx.width / (endx - startx);
                        }
                        this.rangeBar.range = newRange;
                        this.setState({ ...this.state, range: { start: this.rangeBar.range.start, end: this.rangeBar.range.end } });

                        if (this.selector) {
                            this.selector.min = this.rangeBar.range.start;
                            this.selector.max = this.rangeBar.range.end;
                        }
                    }
                    if (this.rangeBar.range.end - this.rangeBar.range.start > 3000) {
                        ctx.strokeStyle = "rgb(255,0,0)";
                        ctx.beginPath();
                        ctx.moveTo(pos, 0);
                        ctx.lineTo(pos, ctx.height);
                        ctx.stroke();
                        //ctx.fillText("SampleRate:" + String(this.props.source.sampleRate), 5, 65);
                        //ctx.fillText("Time:" + String((this.playing.playpos + duration) / this.props.source.sampleRate), 5, 35);
                    }
                }
            }

            ctx.strokeStyle = "rgb(0,0,0)";
            ctx.beginPath();
            ctx.moveTo(0, ctx.height / 2);
            ctx.lineTo(ctx.width, ctx.height / 2);
            ctx.stroke();

            if (!this.playing) {
                this.updated = false;
            }


            //this.requested = true;

        } else {
            //this.requested = false;
        }
        window.requestAnimationFrame(this.animate.bind(this));
    }
    renderCanvas() {
        this.updated = true;

    }
    changeRange() {
        if (this.rangeBar && this.selector) {
            this.selector.min = this.rangeBar.range.start;
            this.selector.max = this.rangeBar.range.end;

            this.setState({ ...this.state, range: { start: this.rangeBar.range.start, end: this.rangeBar.range.end } });
            this.renderCanvas();
        }
    }
    changeSelector() {
        if (this.selector) {
            //this.setState({ ...this.state, range: { start: this.rangeBar.range.start, end: this.rangeBar.range.end } });
            this.renderCanvas();
            if (this.props.onselect) {
                this.props.onselect(this.selector.range);
            }
        }

    }
    setCanvas(e: HTMLCanvasElement | null) {
        if (e && !this.canvas) {
            this.canvas = e;
            this.ctx = this.canvas.getContext("2d");
            this.desktop = new Desktop(this.canvas);
            this.initCanvasComponent();
            this.desktop.render();
        }
    }

    initCanvasComponent() {
        if (!this.canvas) return;
        this.box = new PaintBox(this.desktop);
        //this.box.area.y = 20;
        this.box.area.height = this.canvas.height - 50;
        this.box.hasHandler = false;
        this.rangeBar = new RangeBar(this.desktop);
        this.rangeBar.area.y = this.canvas.height - 40;
        this.rangeBar.change(this.changeRange.bind(this));

        this.selector = new Selector(this.desktop);
        this.selector.area.height = this.box.area.height;
        this.selector.change(this.changeSelector.bind(this));


    }
    render() {
        return <canvas ref={this.setCanvas.bind(this)} width={this.props.width} height={this.props.height}></canvas>
    }
}