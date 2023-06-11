var _a;
import { CodecError } from "./error";
export { CodecError };
export var CodecType;
(function (CodecType) {
    CodecType[CodecType["Null"] = 0] = "Null";
    CodecType[CodecType["Buffer"] = 1] = "Buffer";
    CodecType[CodecType["Number"] = 2] = "Number";
    CodecType[CodecType["String"] = 3] = "String";
    CodecType[CodecType["Array"] = 4] = "Array";
    CodecType[CodecType["Map"] = 5] = "Map";
})(CodecType || (CodecType = {}));
export class Codec {
}
_a = Codec;
Codec.encodeString = (s) => {
    return Buffer.from(s, "utf8");
};
Codec.encodeNumber = (num) => {
    if (num < 0) {
        throw CodecError.negativeNumber();
    }
    const hex = num.toString(16);
    const fullHex = hex.length & 1 ? `0${hex}` : hex;
    return Buffer.from(fullHex, "hex");
};
Codec.encode = (values) => {
    const buffers = new Array();
    for (const value of values) {
        if (value === null || typeof value === "undefined") {
            buffers.push(Buffer.from([CodecType.Null]));
        }
        else if (Buffer.isBuffer(value)) {
            const u32a = new Uint32Array(1);
            u32a[0] = value.length;
            const bufferLength = new Uint8Array(u32a.buffer);
            buffers.push(Buffer.concat([Buffer.from([CodecType.Buffer]), bufferLength, value]));
        }
        else if (typeof value === "number") {
            const buffer = _a.encodeNumber(value);
            const u16a = new Uint16Array(1);
            u16a[0] = buffer.length;
            const bufferLength = new Uint8Array(u16a.buffer);
            buffers.push(Buffer.concat([Buffer.from([CodecType.Number]), bufferLength, buffer]));
        }
        else if (typeof value === "string") {
            const buffer = _a.encodeString(value);
            const u16a = new Uint16Array(1);
            u16a[0] = buffer.length;
            const bufferLength = new Uint8Array(u16a.buffer);
            buffers.push(Buffer.concat([Buffer.from([CodecType.String]), bufferLength, buffer]));
        }
        else if (Array.isArray(value)) {
            const array = value;
            const arrayBuffers = new Array();
            let bufferLength = 0;
            for (const element of array) {
                const buffer = _a.encode([element]);
                arrayBuffers.push(buffer);
                bufferLength += buffer.length;
            }
            const u32a = new Uint32Array(1);
            u32a[0] = bufferLength;
            const lengthBuffer = new Uint8Array(u32a.buffer);
            buffers.push(Buffer.concat([
                Buffer.from([CodecType.Array]),
                lengthBuffer,
                Buffer.concat(arrayBuffers),
            ]));
        }
        else if (value instanceof (Map)) {
            const map = value;
            const mapBuffers = new Array();
            let bufferLength = 0;
            for (const [key, value] of map) {
                if (!_a.isMapKey(key)) {
                    throw CodecError.unsupportedKeyType();
                }
                const keyBuffer = _a.encode([key]);
                const valueBuffer = _a.encode([value]);
                mapBuffers.push(Buffer.concat([keyBuffer, valueBuffer]));
                bufferLength += keyBuffer.length;
                bufferLength += valueBuffer.length;
            }
            const u32a = new Uint32Array(1);
            u32a[0] = bufferLength;
            const lengthBuffer = new Uint8Array(u32a.buffer);
            buffers.push(Buffer.concat([
                Buffer.from([CodecType.Map]),
                lengthBuffer,
                Buffer.concat(mapBuffers),
            ]));
        }
        else {
            throw CodecError.unsupportedType();
        }
    }
    return Buffer.concat(buffers);
};
Codec.decode = (buffer) => {
    let index = 0;
    const values = new Array();
    while (index < buffer.length) {
        const type = buffer.subarray(index, index + 1).readUint8();
        if (type === CodecType.Null) {
            values.push(null);
            index += 1;
        }
        else if (type === CodecType.Buffer) {
            const length = buffer.subarray(index + 1, index + 5).readUint32LE();
            const valueBuffer = buffer.subarray(index + 5, index + 5 + length);
            values.push(valueBuffer);
            index += 5 + length;
        }
        else if (type === CodecType.Number) {
            const length = buffer.subarray(index + 1, index + 3).readUint16LE();
            const valueBuffer = buffer.subarray(index + 3, index + 3 + length);
            const number = parseInt(valueBuffer.toString("hex"), 16);
            if (!Number.isSafeInteger(number)) {
                throw CodecError.unsafeInteger();
            }
            values.push(number);
            index += 3 + length;
        }
        else if (type === CodecType.String) {
            const length = buffer.subarray(index + 1, index + 3).readUint16LE();
            const valueBuffer = buffer.subarray(index + 3, index + 3 + length);
            values.push(valueBuffer.toString("utf8"));
            index += 3 + length;
        }
        else if (type === CodecType.Array) {
            const length = buffer.subarray(index + 1, index + 5).readUint32LE();
            const valueBuffer = buffer.subarray(index + 5, index + 5 + length);
            const arrayValues = _a.decode(valueBuffer);
            values.push(arrayValues);
            index += 5 + length;
        }
        else if (type === CodecType.Map) {
            const length = buffer.subarray(index + 1, index + 5).readUint32LE();
            const valueBuffer = buffer.subarray(index + 5, index + 5 + length);
            const arrayValues = _a.decode(valueBuffer);
            const map = new Map();
            for (let i = 0; i < arrayValues.length; i += 2) {
                const key = arrayValues[i];
                const value = arrayValues[i + 1];
                if (!_a.isMapKey(key)) {
                    throw CodecError.unsupportedKeyType();
                }
                map.set(key, value);
            }
            values.push(map);
            index += 5 + length;
        }
        else {
            throw CodecError.unsupportedType();
        }
    }
    return values;
};
Codec.isMapKey = (key) => {
    return typeof key === "string";
};
//# sourceMappingURL=index.js.map