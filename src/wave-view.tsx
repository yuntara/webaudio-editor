/* reactとreact-domの読み込み */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button } from '@material-ui/core';
import * as file from "./lib/file";
import Audio from "./lib/audio";
/** Helloコンポーネントで取得するpropsの型定義 */
interface WaveViewProps {
    source: AudioBuffer | undefined | null;
    width: number;
    height: number;
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
/** Helloコンポーネント */
export default class WaveView extends React.Component<WaveViewProps, WaveViewState> {
    private canvas: HTMLCanvasElement | null;
    private updated: boolean = true;
    private ctx: CanvasRenderingContext2D | null;
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
    componentDidUpdate() {
        window.requestAnimationFrame(this.animate.bind(this));
    }

    animate() {
        if (this.canvas && this.ctx && this.props.source && this.updated) {
            const source = this.props.source;
            const channels: Float32Array[] = [0, 1].map(n => source.getChannelData(n));


            //analyser.getByteTimeDomainData(dataArray);
            const ctx = this.ctx;
            const { width, height } = this.props;

            ctx.fillStyle = 'rgb(200, 200, 200)';
            ctx.fillRect(0, 0, width, height);

            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgb(0, 0, 0)';

            ctx.beginPath();


            var x = 0;
            const range = this.state.range;
            const channelHeight = height / channels.length;
            let n = 0;
            const span = 20;

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
            ctx.moveTo(0, this.props.height / 2);
            ctx.lineTo(this.props.width, this.props.height / 2);
            ctx.stroke();

            this.updated = false;
            window.requestAnimationFrame(this.animate.bind(this));
        }
    }

    render() {
        return <canvas ref={e => { if (e) { this.canvas = e; this.ctx = this.canvas.getContext("2d"); } }} width={this.props.width} height={this.props.height}></canvas>
    }
}