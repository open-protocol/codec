export type MapKey = string | number | bigint
export type CodecSupported = string | number | bigint | null | undefined | CodecSupported[] | Map<MapKey, CodecSupported>
export enum CodecType {
  Null = 0x00,
  Number = 0x01,
  String = 0x02,
  Array = 0x03,
  Map = 0x04,
}

export class Codec {
  static encodeString = (s: string): Buffer => {
    const isHex = /^[0-9a-fA-F]+$/
    if (!isHex.test(s)) {
      throw new Error('String must be hex.')
    }
    const fullHex = s.length & 1 ? `0${s}` : s
    return Buffer.from(fullHex, 'hex')
  }

  static encodeNumber = (num: number | bigint): Buffer => {
    if (num < 0) {
      throw new Error('Number must be greater than or equal to zero.')
    }
    const hex = num.toString(16)
    const fullHex = hex.length & 1 ? `0${hex}` : hex
    return Buffer.from(fullHex, 'hex')
  }

  static bufferLength = (buffer: Buffer): Uint8Array => {
    const u16a = new Uint16Array(1)
    u16a[0] = buffer.length
    return new Uint8Array(u16a.buffer)
  }

  static encode = (values: Array<CodecSupported>): Buffer => {
    const buffers = new Array<Buffer>()
    for (const value of values) {
      if (value === null || typeof value === 'undefined') {
        buffers.push(Buffer.from([CodecType.Null]))
      } else if (typeof value === 'number' || typeof value === 'bigint') {
        const buffer = this.encodeNumber(value)
        const u16a = new Uint16Array(1)
        u16a[0] = buffer.length
        const bufferLength = new Uint8Array(u16a.buffer)
        buffers.push(Buffer.concat([Buffer.from([CodecType.Number]), bufferLength, buffer]))
      } else if (typeof value === 'string') {
        const buffer = this.encodeString(value)
        const u16a = new Uint16Array(1)
        u16a[0] = buffer.length
        const bufferLength = new Uint8Array(u16a.buffer)
        buffers.push(Buffer.concat([Buffer.from([CodecType.String]), bufferLength, buffer]))
      } else if (Array.isArray(value)) {
        const array = value
        const arrayBuffers = new Array<Buffer>()
        let bufferLength = 0
        for (const element of array) {
          const buffer = this.encode([element])
          arrayBuffers.push(buffer)
          bufferLength += buffer.length
        }
        const u32a = new Uint32Array(1)
        u32a[0] = bufferLength
        const lengthBuffer = new Uint8Array(u32a.buffer)
        buffers.push(Buffer.concat([Buffer.from([CodecType.Array]), lengthBuffer, Buffer.concat(arrayBuffers)]))
      } else if (value instanceof Map<MapKey, CodecSupported>) {
        const map = value
        const mapBuffers = new Array<Buffer>()
        let bufferLength = 0
        for (const [key, value] of map) {
          if (!this.isMapKey(key)) {
            throw new Error('Unsupported key type.')
          }
          const keyBuffer = this.encode([key])
          const valueBuffer = this.encode([value])
          mapBuffers.push(Buffer.concat([keyBuffer, valueBuffer]))
          bufferLength += keyBuffer.length
          bufferLength += valueBuffer.length
        }
        const u32a = new Uint32Array(1)
        u32a[0] = bufferLength
        const lengthBuffer = new Uint8Array(u32a.buffer)
        buffers.push(Buffer.concat([Buffer.from([CodecType.Map]), lengthBuffer, Buffer.concat(mapBuffers)]))
      } else {
        throw new Error('Not supported type.')
      }
    }
    return Buffer.concat(buffers)
  }

  static decode = (buffer: Buffer): Array<CodecSupported> => {
    let index = 0
    const values = new Array<CodecSupported>()
    while (index < buffer.length) {
      const type = buffer.subarray(index, index + 1).readUint8()
      if (type === CodecType.Null) {
        values.push(null)
        index += 1
      } else if (type === CodecType.Number) {
        const length = buffer.subarray(index + 1, index + 3).readUint16LE()
        const valueBuffer = buffer.subarray(index + 3, index + 3 + length)
        if (length <= 6) {
          values.push(parseInt(valueBuffer.toString('hex'), 16))
        } else {
          values.push(BigInt(`0x${valueBuffer.toString('hex')}`))
        }
        index += (3 + length)
      } else if (type === CodecType.String) {
        const length = buffer.subarray(index + 1, index + 3).readUint16LE()
        const valueBuffer = buffer.subarray(index + 3, index + 3 + length)
        values.push(valueBuffer.toString('hex'))
        index += (3 + length)
      } else if (type === CodecType.Array) {
        const length = buffer.subarray(index + 1, index + 5).readUint32LE()
        const valueBuffer = buffer.subarray(index + 5, index + 5 + length)
        const arrayValues = this.decode(valueBuffer)
        values.push(arrayValues)
        index += (5 + length)
      } else if (type === CodecType.Map) {
        const length = buffer.subarray(index + 1, index + 5).readUint32LE()
        const valueBuffer = buffer.subarray(index + 5, index + 5 + length)
        const arrayValues = this.decode(valueBuffer)
        const map = new Map<MapKey, CodecSupported>()
        for (let i = 0; i < arrayValues.length; i += 2) {
          const key = arrayValues[i]
          const value = arrayValues[i + 1]
          if (!this.isMapKey(key)) {
            throw new Error('Unsupported key type.')
          }
          map.set(key as MapKey, value)
        }
        values.push(map)
        index += (5 + length)
      } else {
        throw new Error('Unsupported type.')
      }
    }
    return values
  }

  static isMapKey = (key: CodecSupported): boolean => {
    return typeof key === 'number' || typeof key === 'bigint' || typeof key === 'string'
  }
}