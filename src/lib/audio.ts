import * as file from "./file";
export default class Audio {
    private ctx: AudioContext;
    private analyser: AnalyserNode;
    constructor() {
        this.ctx = new AudioContext();
        //this.ctx.createMediaStreamSource()
        this.analyser = this.ctx.createAnalyser();
    }
    async open(audioFile: File): Promise<AudioBuffer> {
        const encodedBuffer = await file.readAsBuffer(audioFile);
        const audioBuffer = await this.ctx.decodeAudioData(encodedBuffer);

        //audioBuffer.copyToChannel();
        return audioBuffer;
    }
    async play(buffer: AudioBuffer) {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
    }
}