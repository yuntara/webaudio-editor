/* reactとreact-domの読み込み */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as file from "./lib/file";
import Audio from "./lib/audio";
import { Desktop } from './lib/canvas-window/desktop';
import { PaintBox } from './lib/canvas-window/paint-box';
import { RangeBar } from "./lib/canvas-window/range-bar";
/** Helloコンポーネントで取得するpropsの型定義 */
interface WaveViewProps {
    source: AudioBuffer | undefined | null;
    width: number;
    height: number;
    audio: Audio | null;
    play: boolean;
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
export default class WaveView extends React.Component<WaveViewProps, WaveViewState> {
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
        if (oldProps.source !== newProps.source && newProps.source && this.rangeBar) {
            this.rangeBar.min = 0;
            this.rangeBar.max = newProps.source.getChannelData(0).length;
            this.rangeBar.range = { start: 0, end: 640 };//this.rangeBar.max / 200 };

        }
        if (oldProps.play != newProps.play && this.props.audio && this.props.source && this.rangeBar) {
            if (newProps.play) {

                this.audiosource = this.props.audio.play(this.props.source,
                    this.props.audio.getSecond(this.props.source, this.rangeBar.range.start),
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
                    playpos: this.rangeBar.range.start
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
                        v = (n + 0.5) * channelHeight + (v * channelHeight / 2);

                        if (i === 0) {
                            ctx.moveTo(i, v);
                        } else {
                            ctx.lineTo(i, v);
                        }
                    }

                }
                ++n;
            }
            ctx.stroke();
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

                        this.setState({ ...this.state, range: { start: this.rangeBar.range.start, end: this.rangeBar.range.end } });
                        this.rangeBar.range = newRange;
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
        if (this.rangeBar) {
            this.setState({ ...this.state, range: { start: this.rangeBar.range.start, end: this.rangeBar.range.end } });
            this.renderCanvas();
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
        this.rangeBar = new RangeBar(this.desktop);
        this.rangeBar.area.y = this.canvas.height - 40;


        this.rangeBar.change(this.changeRange.bind(this));
        /*
                this.openButton = new Button(this.desktop);
                this.openButton.area.set(0, 0, 50, 20);
                this.openButton.text = "Open";
                this.openButton.click = () => {
                    alert("?");
                };*/
    }
    render() {
        return <canvas ref={this.setCanvas.bind(this)} width={this.props.width} height={this.props.height}></canvas>
    }
}