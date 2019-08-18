/* reactとreact-domの読み込み */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button } from '@material-ui/core';
import * as file from "./lib/file";
import Audio from "./lib/audio";
import WaveView from "./wave-view";
/** Helloコンポーネントで取得するpropsの型定義 */
interface AudioEditorProps {

}
/** Helloコンポーネントのstateの型定義 */
interface AudioEditorState {
    inputName: string;
    loaded: boolean;
    buffer: AudioBuffer | null;
    outputName: string;
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
            loaded: false
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
            this.setState({ ...this.state, buffer: this.buffer, loaded: true });
        }
    }
    async play(event: React.MouseEvent<HTMLButtonElement>) {
        if (!this.buffer) { return; }
        await this.audio.play(this.buffer);
    }

    render(): JSX.Element {
        return (
            <div>
                <Button onClick={this.openFile} >Open</Button>
                <Button onClick={this.play} disabled={!this.state.loaded}>Play</Button>
                <WaveView width={640} height={320} source={this.state.buffer} />
            </div>
        );
    }
}
