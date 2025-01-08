//@ts-check

import { Serializer } from "./binary.mjs";
import { AbstractImplementationError } from "./errors.mjs";
import { SocketCtx } from "./socket.mjs";
import { cloneBuffer, Mutex } from "./utils.mjs";

class Entry {
    /** @type {Block} @readonly */ #block;
    /** @type {string} @readonly */ #identifier;
    /** @type {ArrayBuffer} */ #value;
    /** @type {Mutex} @readonly */ #lock;

    /**
     * @param {Block} block
     * @param {string} identifier 
     * @param {ArrayBuffer} value
     */
    constructor(block, identifier, value) {
        this.#block = block;
        this.#identifier = identifier;
        this.#value = value;
        this.#lock = new Mutex();
    }

    get block() {
        return this.#block;
    }

    get identifier() {
        return this.#identifier;
    }

    async get() {
        const r = await this.#lock.acquire();
        const value = cloneBuffer(this.#value);
        r();

        return value;
    }
    
    /**
     * @param {ArrayBuffer} value 
     */
    async set(value) {
        const r = await this.#lock.acquire();
        this.#value = value;
        this.#block._setDirty(this.#identifier);
        r();
    }
}

/**
 * @template T
 */
class EntryView {
    /** @type {boolean} */ isDirty;
    /** @type {Entry} @readonly */ #entry;
    /** @type {Serializer<T>} @readonly */ #serializer;
    /** @type {T} */ #value;

    /**
     * 
     * @param {Entry} entry
     * @param {string} identifier 
     * @param {Serializer<T>} serializer  
     * @param {T} value 
     */
    constructor(entry, identifier, serializer, value) {
        this.#entry = entry;
        this.identifier = identifier;
        this.isDirty = false;
        this.#value = value;
        this.#serializer = serializer;
    }

    /**
     * @returns {T}
     */
    get value() {
        return this.#value;
    }

    /**
     * @param {T} data
     */
    set value(data) {
        this.#value = data;
        this.isDirty = true;
    }


}

class Block {
    /** @type {string} */ identifier;
    /** @type {SocketCtx} */ ctx;
    /** @type {Set<string>} */ #dirtyEntries;
    /** @type {Map<string, Entry>} */ #entries;
    /** @type {Mutex} */ #lock;

    /**
     * @param {string} identifier
     * @param {SocketCtx} ctx
     */
    constructor(identifier, ctx) {
        this.identifier = identifier;
        this.ctx = ctx;
        this.#dirtyEntries = new Set();
        this.#entries = new Map();
        this.#lock = new Mutex();
    }

    _clearDirty() {
        this.#dirtyEntries.clear();
    }

    _clear() {
        this.#entries.clear();
    }

    /**
     * 
     * @param {string} identifier 
     */
    _setDirty(identifier) {
        this.#dirtyEntries.add(identifier);
    }

    /**
     * @param {string} identifier
     * @param {ArrayBuffer} data
     * @returns {Entry}
     */
    _setEntry(identifier, data) {
        const entry = new Entry(this, identifier, data);
        this.#entries.set(identifier, entry);
        return entry;
    }
    
    /**
     * @param {string} identifier
     * @returns {boolean}
     */
    _deleteEntry(identifier) {
        return this.#entries.delete(identifier);
    }

    /**
     * @param {string} identifier
     * @returns {Promise<Entry | undefined>}
     */
    async getEntry(identifier) {
        const release = await this.#lock.acquire();
            const entry = this.#entries.get(identifier);
        release();
        return entry;
    }

    /**
     * @param {string} identifier
     * @returns {Promise<Entry>}
     */
    async getEntryOrCreate(identifier) {
        if (typeof(identifier) !== "string") {
            throw new TypeError("Expected string");
        }
        const release = await this.#lock.acquire();
            let entry = this.#entries.get(identifier);
            if (entry === undefined) {
                entry = this._setEntry(identifier, new ArrayBuffer(0));
                this.#dirtyEntries.add(identifier)
            }
        release();
        return entry;
    }

    async _lock() {
        return await this.#lock.acquire();
    }

    *_getDirtyEntries() {
        for (const entry of this.#dirtyEntries.values()) {
            this.#dirtyEntries.delete(entry);
            yield this.#entries.get(entry) || entry;
        }
    }
    
    /**
     * @param {string} identifier
     * @returns {Promise<boolean>}
     */
    async removeEntry(identifier) {
        const release = await this.#lock.acquire();
            let ret = false;
            if (this.#entries.delete(identifier)){
                this.#dirtyEntries.add(identifier);
                ret = true;
            }
        release();
        return ret;
    }

    /**
     * @param {string} identifier
     * @returns {Promise<boolean>}
     */
    async hasEntry(identifier) {
        const release = await this.#lock.acquire();
            let ret = this.#entries.has(identifier);
        release();
        return ret;
    }

    async flush() {
        const result = await this.ctx.flushBlock(this);
        if (result !== 0) {
            throw new Error("Failed to flush block, error: " + String(result));
        }
        this._clearDirty();
    }
}

export {
    Block,
    Entry
}