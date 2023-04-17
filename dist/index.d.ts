/// <reference types="node" />
export type MapKey = string | number | bigint;
export type CodecSupported = string | number | bigint | null | undefined | CodecSupported[] | Map<MapKey, CodecSupported>;
export declare enum CodecType {
    Null = 0,
    Number = 1,
    String = 2,
    Array = 3,
    Map = 4
}
export declare class Codec {
    static encodeString: (s: string) => Buffer;
    static encodeNumber: (num: number | bigint) => Buffer;
    static bufferLength: (buffer: Buffer) => Uint8Array;
    static encode: (values: Array<CodecSupported>) => Buffer;
    static decode: (buffer: Buffer) => Array<CodecSupported>;
    static isMapKey: (key: CodecSupported) => boolean;
}
