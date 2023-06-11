import { CodecError } from "./error";
export { CodecError };

export type MapKey = string;
export type CodecSupported =
  | string
  | Buffer
  | number
  | null
  | undefined
  | CodecSupported[]
  | Map<MapKey, CodecSupported>;
export enum CodecType {
  Null = 0x00,
  Buffer = 0x01,
  Number = 0x02,
  String = 0x03,
  Array = 0x04,
  Map = 0x05,
}

export class Codec {
  static encodeString = (s: string): Buffer => {
    return Buffer.from(s, "utf8");
  };

  static encodeNumber = (num: number | bigint): Buffer => {
    if (num < 0) {
      throw CodecError.negativeNumber();
    }
    const hex = num.toString(16);
    const fullHex = hex.length & 1 ? `0${hex}` : hex;
    return Buffer.from(fullHex, "hex");
  };

  static encode = (values: Array<CodecSupported>): Buffer => {
    const buffers = new Array<Buffer>();
    for (const value of values) {
      if (value === null || typeof value === "undefined") {
        buffers.push(Buffer.from([CodecType.Null]));
      } else if (Buffer.isBuffer(value)) {
        const u32a = new Uint32Array(1);
        u32a[0] = value.length;
        const bufferLength = new Uint8Array(u32a.buffer);
        buffers.push(
          Buffer.concat([Buffer.from([CodecType.Buffer]), bufferLength, value])
        );
      } else if (typeof value === "number") {
        const buffer = this.encodeNumber(value);
        const bufferLength = new Uint8Array(1);
        bufferLength[0] = buffer.length;
        buffers.push(
          Buffer.concat([Buffer.from([CodecType.Number]), bufferLength, buffer])
        );
      } else if (typeof value === "string") {
        const buffer = this.encodeString(value);
        const u16a = new Uint16Array(1);
        u16a[0] = buffer.length;
        const bufferLength = new Uint8Array(u16a.buffer);
        buffers.push(
          Buffer.concat([Buffer.from([CodecType.String]), bufferLength, buffer])
        );
      } else if (Array.isArray(value)) {
        const array = value;
        const arrayBuffers = new Array<Buffer>();
        let bufferLength = 0;
        for (const element of array) {
          const buffer = this.encode([element]);
          arrayBuffers.push(buffer);
          bufferLength += buffer.length;
        }
        const u32a = new Uint32Array(1);
        u32a[0] = bufferLength;
        const lengthBuffer = new Uint8Array(u32a.buffer);
        buffers.push(
          Buffer.concat([
            Buffer.from([CodecType.Array]),
            lengthBuffer,
            Buffer.concat(arrayBuffers),
          ])
        );
      } else if (value instanceof Map<MapKey, CodecSupported>) {
        const map = value;
        const mapBuffers = new Array<Buffer>();
        let bufferLength = 0;
        for (const [key, value] of map) {
          if (!this.isMapKey(key)) {
            throw CodecError.unsupportedKeyType();
          }
          const keyBuffer = this.encode([key]);
          const valueBuffer = this.encode([value]);
          mapBuffers.push(Buffer.concat([keyBuffer, valueBuffer]));
          bufferLength += keyBuffer.length;
          bufferLength += valueBuffer.length;
        }
        const u32a = new Uint32Array(1);
        u32a[0] = bufferLength;
        const lengthBuffer = new Uint8Array(u32a.buffer);
        buffers.push(
          Buffer.concat([
            Buffer.from([CodecType.Map]),
            lengthBuffer,
            Buffer.concat(mapBuffers),
          ])
        );
      } else {
        throw CodecError.unsupportedType();
      }
    }
    return Buffer.concat(buffers);
  };

  static decode = (buffer: Buffer): Array<CodecSupported> => {
    let index = 0;
    const values = new Array<CodecSupported>();
    while (index < buffer.length) {
      const type = buffer.subarray(index, index + 1).readUint8();
      if (type === CodecType.Null) {
        values.push(null);
        index += 1;
      } else if (type === CodecType.Buffer) {
        const length = buffer.subarray(index + 1, index + 5).readUint32LE();
        const valueBuffer = buffer.subarray(index + 5, index + 5 + length);
        values.push(valueBuffer);
        index += 5 + length;
      } else if (type === CodecType.Number) {
        const length = buffer.subarray(index + 1, index + 2).readUint8();
        const valueBuffer = buffer.subarray(index + 2, index + 2 + length);
        const number = parseInt(valueBuffer.toString("hex"), 16);
        if (!Number.isSafeInteger(number)) {
          throw CodecError.unsafeInteger();
        }
        values.push(number);
        index += 2 + length;
      } else if (type === CodecType.String) {
        const length = buffer.subarray(index + 1, index + 3).readUint16LE();
        const valueBuffer = buffer.subarray(index + 3, index + 3 + length);
        values.push(valueBuffer.toString("utf8"));
        index += 3 + length;
      } else if (type === CodecType.Array) {
        const length = buffer.subarray(index + 1, index + 5).readUint32LE();
        const valueBuffer = buffer.subarray(index + 5, index + 5 + length);
        const arrayValues = this.decode(valueBuffer);
        values.push(arrayValues);
        index += 5 + length;
      } else if (type === CodecType.Map) {
        const length = buffer.subarray(index + 1, index + 5).readUint32LE();
        const valueBuffer = buffer.subarray(index + 5, index + 5 + length);
        const arrayValues = this.decode(valueBuffer);
        const map = new Map<MapKey, CodecSupported>();
        for (let i = 0; i < arrayValues.length; i += 2) {
          const key = arrayValues[i];
          const value = arrayValues[i + 1];
          if (!this.isMapKey(key)) {
            throw CodecError.unsupportedKeyType();
          }
          map.set(key as MapKey, value);
        }
        values.push(map);
        index += 5 + length;
      } else {
        throw CodecError.unsupportedType();
      }
    }
    return values;
  };

  static isMapKey = (key: CodecSupported): boolean => {
    return typeof key === "string";
  };
}
