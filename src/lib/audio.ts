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
    play(buffer: AudioBuffer, pos: number = 0, duration: number | undefined = undefined, onend: () => void) {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(undefined, pos, duration);
        if (onend) {
            source.onended = onend;
        }
        return source;
    }
    currentTime() {
        return this.ctx.currentTime;
    }
    getSecond(buffer: AudioBuffer, pos: number) {
        return pos / buffer.sampleRate;
    }
}