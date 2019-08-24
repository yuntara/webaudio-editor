declare module "lamejs" {
    export type IntArray = Int8Array | Int16Array | Int32Array;
    export class Mp3Encoder {
        constructor(channels: number, samples: number, kbps: number);

        encodeBuffer(buffer: IntArray): Int8Array;
        encodeBuffer(left: IntArray, right: IntArray): Int8Array;

        flush(): Int8Array;
    }
}