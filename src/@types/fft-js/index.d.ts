declare module "fft-js" {
    export type IntArray = number[] | Float32Array | Int8Array | Int16Array | Int32Array;
    export function fft(buffer: IntArray): [number, number][];
}