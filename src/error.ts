export class CodecError implements Error {
  name: string;
  message: string;
  stack?: string;

  constructor(name: string, message: string) {
    this.name = name;
    this.message = message;
  }

  static negativeNumber = (): CodecError => {
    return new CodecError(
      "NegativeNumber",
      "Number must be greater than or equal to zero"
    );
  };

  static unsupportedKeyType = (): CodecError => {
    return new CodecError("UnsupportedKeyType", "Unsupported key type");
  };

  static unsupportedType = (): CodecError => {
    return new CodecError("UnsupportedType", "Unsupported type");
  };

  static unsafeInteger = (): CodecError => {
    return new CodecError("UnsafeInteger", "Unsafe integer");
  };
}
