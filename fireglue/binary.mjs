//@ts-check

import { AbstractImplementationError } from "./errors.mjs";
import { PacketHeader } from "./socket.mjs";

class BinaryWriter {
    /** @type {number} */ #offsetActual;
    /** @type {number} */ #offsetCurrent;
    /** @type {DataView} */ #view;
    /** @type {Uint8Array} */ #buffer;

    /**
     * @param {number} size 
     */
    constructor(size) {
        this.#buffer = new Uint8Array(new ArrayBuffer(Math.max(size, 16)));
        this.#view = new DataView(this.#buffer.buffer);
        this.#offsetActual = 0;
        this.#offsetCurrent = 0;
    }

    get offset() {
        return this.#offsetCurrent;
    }

    set offset(value) {
        this.#offsetCurrent = value;
        this.#offsetActual = Math.max(this.#offsetActual, value);
    }

    get written() {
        return this.#offsetActual;
    }

    /**
     * 
     * @param {number} length 
     */
    #fit(length) {
        if (this.#view.byteLength - this.offset >= length) {
            return;
        }

        const buffer = new ArrayBuffer(this.#view.byteLength * 2);
        this.#buffer = new Uint8Array(buffer);
        this.#view = new DataView(buffer);
    }
    
    /**
     * 
     * @param {number} value
     */
    writeInt8(value) {
        this.#fit(1);
        this.#view.setInt8(this.offset, value);
        this.offset += 1;
    }
    
    /**
     * 
     * @param {number} value
     */
    writeInt16(value) {
        this.#fit(2);
        this.#view.setInt16(this.offset, value, true);
        this.offset += 2;
    }
    
    /**
     * 
     * @param {number} value
     */
    writeInt32(value) {
        this.#fit(4);
        this.#view.setInt32(this.offset, value, true);
        this.offset += 4;
    }
    
    /**
     * 
     * @param {bigint} value
     */
    writeBigInt64(value) {
        this.#fit(8);
        this.#view.setBigInt64(this.offset, value, true);
        this.offset += 8;
    }
    
    /**
     * 
     * @param {number} value
     */
    writeUint8(value) {
        this.#fit(1);
        this.#view.setUint8(this.offset, value);
        this.offset += 1;
    }
    
    /**
     * 
     * @param {number} value
     */
    writeUint16(value) {
        this.#fit(2);
        this.#view.setUint16(this.offset, value, true);
        this.offset += 2;
    }
    
    /**
     * 
     * @param {number} value
     */
    writeUint32(value) {
        this.#fit(4);
        this.#view.setUint32(this.offset, value, true);
        this.offset += 4;
    }
    
    /**
     * 
     * @param {bigint} value
     */
    writeBigUint64(value) {
        this.#fit(8);
        this.#view.setBigUint64(this.offset, value, true);
        this.offset += 8;
    }
    
    /**
     * 
     * @param {number} value
     */
    writeFloat32(value) {
        this.#fit(4);
        this.#view.setFloat32(this.offset, value, true);
        this.offset += 4;
    }
    
    /**
     * 
     * @param {number} value
     */
    writeFloat64(value) {
        this.#fit(8);
        this.#view.setFloat64(this.offset, value, true);
        this.offset += 8;
    }

    /**
     * 
     * @param {Uint8Array} buffer 
     */
    writeBytes(buffer) {
        this.#fit(buffer.length);
        this.#buffer.set(buffer, this.offset)
        this.offset += buffer.length;
    }

    getWritten() {
        return this.#buffer.slice(0, this.#offsetActual);
    }

    sliceRest() {
        return this.#buffer.slice(this.#offsetActual);
    }
}

class BinaryReader {
    /** @type {number} */ #offset;
    /** @type {number} */ #origin;
    /** @type {DataView} @readonly */ #view;

    /**
     * @param {ArrayBuffer} buffer 
     */
    constructor(buffer) {
        this.#view = new DataView(buffer);
        this.#offset = 0;
        this.#origin = 0;
    }

    /**
     * @returns {number}
     */
    get length() {
        return this.#view.byteLength - this.#offset;
    }

    /**
     * 
     * @param {number} amount 
     */
    skip(amount) {
        return this.#offset += amount;
    }
    
    /**
     * 
     * @returns {number}
     */
    readInt8() {
        const value = this.#view.getInt8(this.#offset);
        this.#offset += 1;
		return value;
    }
    
    /**
     * 
     * @returns {number}
     */
    readInt16() {
        const value = this.#view.getInt16(this.#offset, true);
        this.#offset += 2;
		return value;
    }
    
    /**
     * 
     * @returns {number}
     */
    readInt32() {
        const value = this.#view.getInt32(this.#offset, true);
        this.#offset += 4;
		return value;
    }
    
    /**
     * 
     * @returns {bigint}
     */
    readBigInt64() {
        const value = this.#view.getBigInt64(this.#offset, true);
        this.#offset += 8;
		return value;
    }
    
    /**
     * 
     * @returns {number}
     */
    readUint8() {
        const value = this.#view.getUint8(this.#offset);
        this.#offset += 1;
		return value;
    }
    
    /**
     * 
     * @returns {number}
     */
    readUint16() {
        const value = this.#view.getUint16(this.#offset, true);
        this.#offset += 2;
		return value;
    }
    
    /**
     * 
     * @returns {number}
     */
    readUint32() {
        const value = this.#view.getUint32(this.#offset, true);
        this.#offset += 4;
		return value;
    }
    
    /**
     * 
     * @returns {bigint}
     */
    readBigUint64() {
        const value = this.#view.getBigUint64(this.#offset, true);
        this.#offset += 8;
		return value;
    }
    
    /**
     * 
     * @returns {number}
     */
    readFloat32() {
        const value = this.#view.getFloat32(this.#offset, true);
        this.#offset += 4;
		return value;
    }
    
    /**
     * 
     * @returns {number}
     */
    readFloat64() {
        const value = this.#view.getFloat64(this.#offset, true);
        this.#offset += 8;
		return value;
    }

    /**
     * 
     * @param {number} amount 
     * @returns {Uint8Array}
     */
    readBytes(amount) {
        const value = new Uint8Array(this.#view.buffer, this.#offset, amount);
        this.#offset += amount;
        return value;
    }

    /**
     * @returns {ArrayBuffer}
     */
    sliceBuffer() {
        const slice = this.#view.buffer.slice(this.#origin, this.#offset);
        this.#origin = this.#offset;
        return slice;
    }

    sliceRest() {
        return this.#view.buffer.slice(this.#offset);
    }
}

/**
 * @template T
 */
class Serializer {
    /**
     * @abstract
     * @param {T} data 
     * @param {BinaryWriter} writer 
     */
    write(data, writer) {
        throw new AbstractImplementationError();
    }

    /**
     * @abstract
     * @param {BinaryReader} reader
     * @returns {T} 
     */
    read(reader) {
        throw new AbstractImplementationError();
    }
}

/**
 * @extends Serializer<string|null>
 */
class StringSerializer extends Serializer {
    /** @type {TextDecoder} @readonly */ #decoder = new TextDecoder("utf-8", { fatal: false });
    /** @type {TextEncoder} @readonly */ #encoder = new TextEncoder();
    
    /**
     * 
     * @param {BinaryReader} reader 
     */
    read(reader) {
        const length = reader.readInt32();
        if (length < 0) return null;
        if (length === 0) return "";
        return this.#decoder.decode(reader.readBytes(length));
    }

    /**
     * @param {string|null} value
     * @param {BinaryWriter} writer 
     */
    write(value, writer) {
        if (value === null) {
            writer.writeInt32(-1);
            return;
        }
        if (value.length === 0) {
            writer.writeInt32(0);
            return;
        }
        const bytes = this.#encoder.encode(value);
        writer.writeInt32(bytes.length);
        writer.writeBytes(bytes);
    }
    
    /**
     * @param {string} value
     * @returns {Uint8Array}
     */
    serlIdentifier(value) {
        if (value.length < 1) {
            throw new RangeError("Identifiers must be at least 1 character long");
        }
        if (value.length > 2048) {
            throw new RangeError("Identifiers must not be longer than 2048 characters when encoded");
        }

        const bytes = this.#encoder.encode(value);
        if (bytes.length > 2048) {
            throw new RangeError("Identifiers must not be longer than 2048 characters when encoded");
        }

        return bytes;
    }
    
    /**
     * @param {Uint8Array} value
     * @returns {string}
     */
    deserlIdentifier(value) {
        if (value.length < 1) {
            throw new RangeError("Identifiers must be at least 1 character long");
        }
        if (value.length > 2048) {
            throw new RangeError("Identifiers must not be longer than 2048 characters when decoded");
        }

        const str = this.#decoder.decode(value);
        if (str.length > 2048) {
            throw new RangeError("Identifiers must not be longer than 2048 characters when decoded");
        }

        return str;
    }
    
    /**
     * @param {string} value
     * @returns {Uint8Array}
     */
    serlBlockIdentifier(value) {
        if (value.length < 1) {
            throw new RangeError("Block identifiers must be at least 1 character long");
        }
        if (value.length > 1024) {
            throw new RangeError("Block identifiers must not be longer than 1024 characters when encoded");
        }

        const bytes = this.#encoder.encode(value);
        if (bytes.length > 1024) {
            throw new RangeError("Block identifiers must not be longer than 1024 characters when encoded");
        }

        return bytes;
    }
    
    /**
     * @param {Uint8Array} value
     * @returns {string}
     */
    deserlBlockIdentifier(value) {
        if (value.length < 1) {
            throw new RangeError("Block identifiers must be at least 1 character long");
        }
        if (value.length > 1024) {
            throw new RangeError("Block identifiers must not be longer than 1024 characters when decoded");
        }

        const str = this.#decoder.decode(value);
        if (str.length > 1024) {
            throw new RangeError("Block identifiers must not be longer than 1024 characters when decoded");
        }

        return str;
    }
    
    /**
     * @param {Uint8Array} value
     * @returns {string}
     */
    deserlNickname(value) {
        if (value.length < 1) {
            throw new RangeError("Nicknames must be at least 1 character long");
        }

        const str = this.#decoder.decode(value);
        if (str.length > 256) {
            throw new RangeError("Nicknames must not be longer than 256 characters when decoded");
        }

        return str;
    }
    
    /** @type {StringSerializer} @readonly */ static #instance = new StringSerializer();
    
    /**
     * @returns {StringSerializer}
     */
    static get instance() {
        return this.#instance;
    }

    /**
     * @param {number} length 
     */
    static maxSize(length) {
        return length * 3 + 4;
    }
}


/**
 * @extends Serializer<number>
 */
class Int32Serializer extends Serializer {
    /**
     * 
     * @param {BinaryReader} reader 
     */
    read(reader) {
        return reader.readInt32();
    }

    /**
     * @param {number} value
     * @param {BinaryWriter} writer 
     */
    write(value, writer) {
        writer.writeInt32(value);
    }
    
    /** @type {Int32Serializer} @readonly */ static #instance = new Int32Serializer();
    
    /**
     * @returns {Int32Serializer}
     */
    static get instance() {
        return this.#instance;
    }
}



/**
 * @extends Serializer<PacketHeader>
 */
class PacketHeaderSerializer extends Serializer {
    /**
     * 
     * @param {BinaryReader} reader 
     */
    read(reader) {
        const version = reader.readUint8();
        if (version !== 1) {
            throw new Error("Tried to read a non version 1 packet header");
        }
        const seqNum = reader.readUint32();
        const message = reader.readUint8();
        const method = reader.readUint8();
        const length = reader.readInt32();
        if (length < 0) {
            throw new Error("Negative length packet");
        }

        return new PacketHeader(message, method, seqNum, length);
    }

    /**
     * @param {PacketHeader} value
     * @param {BinaryWriter} writer 
     */
    write(value, writer) {
        writer.writeUint8(1);
        writer.writeUint32(value.sequenceNumber);
        writer.writeUint16(value.eventType);
        writer.writeUint8(value.method);
        writer.writeInt32(value.length);
    }

    /**
     * 
     * @param {number} eventType 
     * @param {number} method 
     * @param {number} sequenceNumber 
     * @param {number} length 
     * @param {BinaryWriter} writer 
     */
    writeDirect(eventType, method, sequenceNumber, length, writer) {
        writer.writeUint8(1);
        writer.writeUint32(sequenceNumber);
        writer.writeUint8(eventType);
        writer.writeUint8(method);
        writer.writeInt32(length);
    }
    
    /** @type {PacketHeaderSerializer} @readonly */ static #instance = new PacketHeaderSerializer();
    
    /**
     * @returns {PacketHeaderSerializer}
     */
    static get instance() {
        return this.#instance;
    }
}

const HexLookup = [];
HexLookup[48] = 0;
HexLookup[49] = 1;
HexLookup[50] = 2;
HexLookup[51] = 3;
HexLookup[52] = 4;
HexLookup[53] = 5;
HexLookup[54] = 6;
HexLookup[55] = 7;
HexLookup[56] = 8;
HexLookup[57] = 9;
HexLookup[65] = HexLookup[97] = 10;
HexLookup[66] = HexLookup[98] = 11;
HexLookup[67] = HexLookup[99] = 12;
HexLookup[68] = HexLookup[100] = 13;
HexLookup[69] = HexLookup[101] = 14;
HexLookup[70] = HexLookup[102] = 15; 


/**
 * @param {string} hex 
 * @returns {Uint8Array}
 */
function guidHexToUint8Array(hex) {
    const arr = new Uint8Array(16);
    for (let i = 0; i < 32; i += 8) {
        const index = i >> 1;
        arr[index] = 
              HexLookup[hex.charCodeAt(i)] << 4 
            | HexLookup[hex.charCodeAt(i + 1)];
        arr[index + 1] = 
              HexLookup[hex.charCodeAt(i + 2)] << 4 
            | HexLookup[hex.charCodeAt(i + 3)];
        arr[index + 2] = 
              HexLookup[hex.charCodeAt(i + 4)] << 4 
            | HexLookup[hex.charCodeAt(i + 5)];
        arr[index + 3] = 
              HexLookup[hex.charCodeAt(i + 6)] << 4 
            | HexLookup[hex.charCodeAt(i + 7)];
    }
    return arr;
} 

const SIZE_PacketHeader = 11;

/**
 * 
 * @param {Uint8Array} buffer 
 * @param {number} seed 
 */
function cyrb53(buffer, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < buffer.length; i++) {
        ch = buffer[i];
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export {
    BinaryReader,
    BinaryWriter,
    Serializer,
    Int32Serializer,
    StringSerializer,
    PacketHeaderSerializer,
    SIZE_PacketHeader,
    guidHexToUint8Array
}