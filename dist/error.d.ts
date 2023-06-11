export declare class CodecError implements Error {
    name: string;
    message: string;
    stack?: string;
    constructor(name: string, message: string);
    static negativeNumber: () => CodecError;
    static unsupportedKeyType: () => CodecError;
    static unsupportedType: () => CodecError;
    static unsafeInteger: () => CodecError;
}
