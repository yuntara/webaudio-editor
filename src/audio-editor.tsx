/* reactとreact-domの読み込み */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button, Select, MenuItem } from '@material-ui/core';
import * as file from "./lib/file";
import Audio from "./lib/audio";
import { WaveView, ViewMode } from "./wave-view";
import { Range } from './lib/canvas-window/range-bar';
import * as lamejs from "lamejs";
import SelectInput from '@material-ui/core/Select/SelectInput';
import LinearProgress from '@material-ui/core/LinearProgress';

interface HTMLSelectEvent extends Event {
    target: HTMLSelectElement & EventTarget;
}


/** Helloコンポーネントで取得するpropsの型定義 */
interface AudioEditorProps {

}

/** Helloコンポーネントのstateの型定義 */
interface AudioEditorState {
    inputName: string;
    loaded: boolean;
    buffer: AudioBuffer | null;
    outputName: string;
    audio: Audio | null;
    play: boolean;
    zoom: boolean;
    selected: Range | null;
    canvasUpdate: boolean;
    saving: boolean;
    savingProgress: number;
    viewMode: ViewMode;
}
/** Helloコンポーネント */
export default class AudioEditor extends React.Component<AudioEditorProps, AudioEditorState> {
    private audio: Audio;
    private buffer: AudioBuffer | undefined;
    constructor(props: AudioEditorProps) {
        super(props);
        this.state = {
            inputName: '',
            outputName: '',
            buffer: null,
            loaded: false,
            play: false,
            audio: null,
            zoom: false,
            selected: null,
            canvasUpdate: false,
            saving: false,
            savingProgress: 0,
            viewMode: ""
        };
        this.audio = new Audio();
        this.openFile = this.openFile.bind(this);
        this.play = this.play.bind(this);

    }
    async openFile(event: React.MouseEvent<HTMLButtonElement>) {
        const mp3 = await file.showOpenFileDialog("mp3,audio/mp3");
        if (mp3) {
            console.log(mp3);
            this.buffer = await this.audio.open(mp3);
            this.setState({ ...this.state, buffer: this.buffer, audio: this.audio, loaded: true });
        }
    }
    onend() {
        this.setState({ ...this.state, play: false });
    }
    async play(event: React.MouseEvent<HTMLButtonElement>) {

        this.setState({ ...this.state, play: !this.state.play });
    }
    zoom() {
        this.setState({ ...this.state, zoom: !this.state.zoom });
    }
    select(selected: Range | null) {
        this.setState({ ...this.state, selected });
    }
    silent() {
        const range = this.state.selected;
        if (!range || !this.buffer) {
            return;
        }
        const buffer = this.buffer;
        const channels = [0, 1].map(n => buffer.getChannelData(n));
        for (let channel of channels) {
            for (let i = range.start; i < range.end; ++i) {
                channel[i] = 0;
            }
        }
        this.canvasUpdate();
    }
    canvasUpdate() {
        this.setState({ ...this.state, canvasUpdate: !this.state.canvasUpdate });
    }
    changeVideMode(event: HTMLSelectEvent | null) {
        if (event) {
            this.setState({ ...this.state, viewMode: event.target ? event.target.value as ViewMode : "" });
        }
    }
    getIntBuffer(channel: number, blocksize: number) {
        if (!this.buffer) {
            throw new Error("buffer not provided");
        }
        const floatbuffer = this.buffer.getChannelData(channel);
        const size = blocksize * Math.ceil(floatbuffer.length / blocksize);
        let intbuffer: Int16Array = new Int16Array(size);

        for (let i = 0; i < intbuffer.length; ++i) {
            if (i >= floatbuffer.length) {
                intbuffer[i] = 0;
            } else {
                intbuffer[i] = Math.round(floatbuffer[i] * 0.9 * 32767);
            }
        }

        return intbuffer;
    }
    async sleep() {
        return new Promise(resolve => setTimeout(resolve, 1));
    }
    async save() {
        if (!this.buffer) { return; }
        const mp3encoder = new lamejs.Mp3Encoder(2, this.buffer.sampleRate, 256);

        let mp3Data = [];

        const sampleBlockSize = 1152; //can be anything but make it a multiple of 576 to make encoders life easier
        console.log("getBuffer");
        let left = this.getIntBuffer(0, sampleBlockSize); //one second of silence (get your data from the source you have)
        let right = this.getIntBuffer(1, sampleBlockSize); //one second of silence (get your data from the source you have)
        const timer = 150;
        let start = new Date();
        console.log(sampleBlockSize);
        for (var i = 0; i < left.length; i += sampleBlockSize) {
            const leftChunk = left.subarray(i, i + sampleBlockSize);
            const rightChunk = right.subarray(i, i + sampleBlockSize);
            var mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);

            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
            const now = new Date();
            if (now.getTime() - start.getTime() > timer) {
                this.setState({ ...this.state, saving: true, savingProgress: (i / left.length * 100) });
                await this.sleep();
                start = now;
            }
        }
        var mp3buf = mp3encoder.flush();   //finish writing mp3

        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
        const url = window.URL.createObjectURL(blob);

        const downLoadLink = document.createElement("a");
        downLoadLink.download = "edited.mp3";
        downLoadLink.href = url;
        downLoadLink.dataset.downloadurl = ["audio/mp3", downLoadLink.download, downLoadLink.href].join(":");
        downLoadLink.click();
        this.setState({ ...this.state, saving: false });
    }
    generate() {
        const code = prompt("x : position,n :channel 0-,v : now channel data");
        if (code) {

            const func = new Function("x", "n", "v", `
            function h(s){
                return Math.sin(s*${2 * Math.PI / (this.buffer ? this.buffer.sampleRate : 44100)});
            };\n`+
                code);

            const range = this.state.selected;
            if (!range || !this.buffer) {
                return;
            }
            const buffer = this.buffer;
            const channels = [0, 1].map(n => buffer.getChannelData(n));
            let n = 0;
            for (let channel of channels) {
                for (let i = range.start; i < range.end; ++i) {
                    channel[i] = func(i - range.start, n, channel[i]);
                }
                ++n;
            }
            this.canvasUpdate();

        }
    }
    render(): JSX.Element {
        return (
            <div>
                <Button onClick={this.openFile} >Open</Button>
                <Button onClick={this.play} disabled={!this.state.loaded}>{this.state.play ? "Stop" : "Play"}</Button>
                <Button onClick={this.zoom.bind(this)} disabled={!this.state.loaded}>{"zoom"}</Button>
                <Button onClick={this.silent.bind(this)} disabled={!this.state.selected}>{"toSlilent"}</Button>
                <Button onClick={this.generate.bind(this)} disabled={!this.state.selected}>{"Generate"}</Button>

                <Button onClick={this.save.bind(this)} disabled={!this.state.loaded}>{"Save"}</Button>
                <Select
                    value={this.state.viewMode}
                    onChange={this.changeVideMode.bind(this)}

                >
                    <MenuItem value={""} selected>Normal</MenuItem>
                    <MenuItem value={"normalize"}>Normalize</MenuItem>
                    <MenuItem value={"sqrt"}>Sqrt</MenuItem>
                    <MenuItem value={"spectrum"}>Spectrum</MenuItem>
                    <MenuItem value={"spectrum-color"}>ColorSpectrum</MenuItem>

                </Select>
                {
                    (this.state.saving) ?
                        <LinearProgress variant="determinate" value={this.state.savingProgress} />
                        : null
                }
                <br />
                <br />
                <WaveView width={800} viewMode={this.state.viewMode} canvasUpdate={this.state.canvasUpdate} onselect={this.select.bind(this)} height={480} zoom={this.state.zoom} onend={this.onend.bind(this)} audio={this.state.audio} play={this.state.play} source={this.state.buffer} />
            </div>
        );
    }
}
