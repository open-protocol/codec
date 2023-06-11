/// <reference types="node" />
import { CodecError } from "./error";
export { CodecError };
export type MapKey = string;
export type CodecSupported = string | Buffer | number | null | undefined | CodecSupported[] | Map<MapKey, CodecSupported>;
export declare enum CodecType {
    Null = 0,
    Buffer = 1,
    Number = 2,
    String = 3,
    Array = 4,
    Map = 5
}
export declare class Codec {
    static encodeString: (s: string) => Buffer;
    static encodeNumber: (num: number | bigint) => Buffer;
    static encode: (values: Array<CodecSupported>) => Buffer;
    static decode: (buffer: Buffer) => Array<CodecSupported>;
    static isMapKey: (key: CodecSupported) => boolean;
}
