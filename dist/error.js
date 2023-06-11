export class CodecError {
    constructor(name, message) {
        this.name = name;
        this.message = message;
    }
}
CodecError.negativeNumber = () => {
    return new CodecError("NegativeNumber", "Number must be greater than or equal to zero");
};
CodecError.unsupportedKeyType = () => {
    return new CodecError("UnsupportedKeyType", "Unsupported key type");
};
CodecError.unsupportedType = () => {
    return new CodecError("UnsupportedType", "Unsupported type");
};
CodecError.unsafeInteger = () => {
    return new CodecError("UnsafeInteger", "Unsafe integer");
};
//# sourceMappingURL=error.js.map