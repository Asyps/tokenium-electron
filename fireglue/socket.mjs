//@ts-check
import { guidHexToUint8Array, BinaryReader, BinaryWriter, PacketHeaderSerializer, SIZE_PacketHeader, StringSerializer } from "./binary.mjs";
import { AbstractImplementationError, assertArgType } from "./errors.mjs";
import { Block, Entry } from "./kvstore.mjs";
import * as PacketEventType from "./packetEventTypeEnum.mjs";
import * as PacketMethod from "./packetMethodEnum.mjs";
import * as PacketStatucCode from "./packetStatusCodeEnum.mjs";
import * as UserUpdateFlags from "./userUpdateFlags.mjs";
import { ExposedPromise, Mutex, Uint8Compare } from "./utils.mjs";

/**
 * @typedef {import("./interfaces").PacketPredicate} PacketPredicate
 * @typedef {import("./interfaces").PromiseResolve<void>} PromiseResolveVoid 
 * @typedef {import("./interfaces").PromiseReject} PromiseReject 
 * @typedef {import("./interfaces").ReadonlyUint8Array} ReadonlyUint8Array
 * @typedef {import("./interfaces").SocketCtxEventMap} SocketCtxEventMap
 * 
 */

class PacketHeader {
    /** @type {number} */ eventType;
    /** @type {number} */ method;
    /** @type {number} */ sequenceNumber;
    /** @type {number} */ length;

    /**
     * @param {number} eventType 
     * @param {number} method 
     * @param {number} sequenceNumber 
     * @param {number} length 
     */
    constructor(eventType, method, sequenceNumber, length) {
        assertArgType(eventType, "number", 1);
        assertArgType(method, "number", 2);
        assertArgType(sequenceNumber, "number", 3);
        assertArgType(length, "number", 4);

        this.eventType = eventType;
        this.method = method;
        this.sequenceNumber = sequenceNumber;
        this.length = length;
    }
}

class Packet {
    /** @type {PacketHeader} */ header;
    /** @type {ArrayBuffer} */ buffer;

    /**
     * @param {PacketHeader} header 
     * @param {ArrayBuffer} buffer 
     */
    constructor(header, buffer) {
        this.header = header;
        this.buffer = buffer;
    }
}

class SocketCtx {
    /** @type {WebSocket} */ __sock;
    /** @type {Map<string, Block | null>} @readonly */ __blocks;
    /** @type {Map<number, ExposedPromise<Packet>>} @readonly */ __requestHandles;
    /** @type {boolean} */ __connected;
    /** @type {number} */ __sequenceNumber;
    /** @type {User} */ __user;
    /** @type {Map<bigint, Player>} */ __players;
    /** @type {EventTarget} @readonly */ __evt;
    /** @type {PromiseResolveVoid} */ __readyPromise;

    constructor() {
        this.__blocks = new Map();
        this.__requestHandles = new Map();
        this.__connected = false;
        this.__sequenceNumber = 0;
        this.__evt = new EventTarget();
        this.__players = new Map();
    }

    #assertOpen() {
        if (!this.__sock.OPEN)
            throw new Error("Socket closed");
    }

    /**
     * 
     * @param {string} hostname 
     * @param {string} username
     * @param {string} password 
     * @param {boolean} insecure
     */
    async connect(hostname, username, password, insecure) {
        const token = await (await fetch(`http${insecure ? "" : "s"}://${hostname}/auth`, {
            method: "POST",
            body: JSON.stringify({ username: username, password: password })
        })).text();

        //@ts-ignore: type smuggling
        this.__user = new UserToken(guidHexToUint8Array(token));
        this.__sock = new WebSocket(`ws${insecure ? "" : "s"}://${hostname}/websocket`, [
            "firebolt.websocket.v1",
            `firebolt.token.${token}`
        ]);
        this.__sock.binaryType = "arraybuffer";

        const promise = new Promise((s, e) => {
            this.__readyPromise = s;
            setTimeout(() => {
                e();
            }, 30e3);
        });

        this.__sock.addEventListener("open", this.__wsOpen.bind(this));
        this.__sock.addEventListener("close", this.__wsClose.bind(this));
        this.__sock.addEventListener("error", this.__wsErr.bind(this));
        this.__sock.addEventListener("message", this.__wsMsg.bind(this));

        return promise;
    }

    async close() {
        this.#assertOpen();
        this.__sock.close();
    }

    /**
     * @param {Event} ev 
     */
    async __wsOpen(ev) {
        console.log(ev);
    }

    /**
     * 
     * @param {CloseEvent} ev 
     */
    async __wsClose(ev) {
        console.log(ev);
    }

    /**
     * 
     * @param {Event} ev 
     */
    async __wsErr(ev) {
        console.log(ev);
    }

    /**
     * 
     * @param {MessageEvent<ArrayBuffer>} ev 
     */
    async __wsMsg(ev) {
        console.log(ev);
        if (ev.data.byteLength < SIZE_PacketHeader) {
            throw new RangeError("Message too small");
        }
        
        const reader = new BinaryReader(ev.data);
        const header = PacketHeaderSerializer.instance.read(reader);
        const packet = new Packet(header, reader.sliceRest());

        console.log(packet);

        if (header.method === PacketMethod.RESPONSE) {
            const handle = this.__requestHandles.get(header.sequenceNumber);
            if (handle !== undefined) {
                handle.resolve(packet);
                this.__requestHandles.delete(header.sequenceNumber);
            }
            else if (header.eventType === PacketEventType.STATUS_CODE) {
                console.warn(`Received status code ${reader.readUint8()}`)
            }
            return;
        }

        switch (header.eventType) {
            case PacketEventType.BROADCAST: {
                if (header.method !== PacketMethod.NORMAL) {
                    console.warn("Received a non-NORMAL BROADCAST packet");
                    break;
                }

                const idLen = reader.readInt16();
                const eventId = StringSerializer.instance.deserlIdentifier(reader.readBytes(idLen));
                this.__evt.dispatchEvent(new SocketBroadcastEvent(eventId, reader.sliceRest()));
                break;
            }
            
            case PacketEventType.BLOCK_UPDATE: {
                if (header.method !== PacketMethod.NORMAL) {
                    console.warn("Received a non-NORMAL BLOCK_UPDATE packet");
                    break;
                }
                
                const blockIdLen = reader.readInt16();
                const blockId = StringSerializer.instance.deserlBlockIdentifier(reader.readBytes(blockIdLen));
                const absolute = reader.readUint8() != 0;
                const len = reader.readInt16();

                let block;
                if (absolute) {
                    if (len < 0) {
                        if (!this.__blocks.delete(blockId)) {
                            console.warn("Tried to remove non-existent block");
                        }
                        break;
                    }
                    block = this.__blocks.get(blockId);
                    if (block === undefined || block === null) {
                        block = new Block(blockId, this);
                        this.__blocks.set(blockId, block);
                    }
                    else {
                        block._clear();
                    }
                }
                else {
                    block = this.__blocks.get(blockId);
                    if (block === undefined || block === null) {
                        block = new Block(blockId, this);
                        this.__blocks.set(blockId, block);
                    }
                }

                const release = await block._lock();
                for (let i = 0; i < len; i++) {
                    const idLen = reader.readInt16();
                    const id = StringSerializer.instance.deserlIdentifier(reader.readBytes(idLen));
                    const remove = reader.readUint8() != 0;

                    if (!remove) {
                        block._setEntry(id, reader.readBytes(reader.readInt32()));
                    }
                    else {
                        block._deleteEntry(id);
                    }
                }
                release();

                this.__evt.dispatchEvent(new SocketBlockUpdateEvent(block));
                break;
            }
        
            case PacketEventType.USER_JOIN: {
                if (header.method !== PacketMethod.NORMAL) {
                    console.warn("Received a non-NORMAL USER_UPDATE packet");
                    break;
                }

                const token = new UserToken(reader.readBytes(16));
                const nickLen = reader.readInt16();
                const nickname = StringSerializer.instance.deserlNickname(reader.readBytes(nickLen));
                const player = new Player(token, nickname);
                this.__players.set(player.token.bigint, player);
                this.__evt.dispatchEvent(new SocketUserJoinEvent(player));
                break;
            }
        
            case PacketEventType.USER_LEAVE: {
                if (header.method !== PacketMethod.NORMAL) {
                    console.warn("Received a non-NORMAL USER_LEAVE packet");
                    break;
                }

                const token = new UserToken(reader.readBytes(16));
                this.__players.delete(token.bigint);
                this.__evt.dispatchEvent(new SocketUserLeaveEvent(token));
                break;
            }

            case PacketEventType.USER_UPDATE: {
                if (header.method !== PacketMethod.NORMAL) {
                    console.warn("Received a non-NORMAL USER_UPDATE packet");
                    break;
                }
                
                // We are the recipient, dont need to parse the token
                reader.skip(16);const flags = reader.readUint16();
                if ((flags & UserUpdateFlags.ADMIN) == UserUpdateFlags.ADMIN) {
                    this.__user._admin = reader.readUint8() !== 0;
                }
                if ((flags & UserUpdateFlags.NICKNAME) == UserUpdateFlags.NICKNAME) {
                    const nickLen = reader.readInt16();
                    const nickname = StringSerializer.instance.deserlNickname(reader.readBytes(nickLen));
                    this.__user._nickname = nickname;
                }
                if ((flags & UserUpdateFlags.BLOCK_ACCESS) == UserUpdateFlags.BLOCK_ACCESS) {
                    const old = new Set(this.__user._blockAccess.values());
                    this.__user._blockAccess.clear();

                    const accessLen = reader.readInt32();
                    for (let i = 0; i < accessLen; i++) {
                        const idLen = reader.readInt16();
                        const id = StringSerializer.instance.deserlBlockIdentifier(reader.readBytes(idLen));
                        this.__user._blockAccess.add(id);
                        old.delete(id);
                    }

                    for (const block of old.values()) {
                        this.__blocks.delete(block);
                    }
                }
                
                this.__evt.dispatchEvent(new SocketUserUpdateEvent(this.__user));
                break;
            }

            case PacketEventType.SYNC_USER_DATA: {
                if (header.method !== PacketMethod.NORMAL) {
                    console.warn("Received a non-NORMAL SYNC_USER_DATA packet");
                    break;
                }

                const admin = reader.readUint8() !== 0;
                const nickLen = reader.readInt16();
                const nickname = StringSerializer.instance.deserlNickname(reader.readBytes(nickLen));
                const accessSet = new Set();
                const accessLen = reader.readInt32();
                for (let i = 0; i < accessLen; i++) {
                    const idLen = reader.readInt16();
                    const id = StringSerializer.instance.deserlBlockIdentifier(reader.readBytes(idLen));
                    accessSet.add(id);
                }

                const playerLen = reader.readInt16();
                for (let i = 0; i < playerLen; i++) {
                    const token = new UserToken(reader.readBytes(16));
                    const nickLen = reader.readInt16();
                    const nickname = StringSerializer.instance.deserlNickname(reader.readBytes(nickLen));
                    const player = new Player(token, nickname);
                    this.__players.set(player.token.bigint, player);
                }

                //@ts-ignore: type smuggling
                this.__user = new User(this.__user , nickname, admin, accessSet);
                this.__readyPromise();

                break;
            }

            default:
                break;
        }
    }

    /**
     * @param {number} seqNum 
     * @param {ArrayBufferLike | Blob | ArrayBufferView} data 
     * @returns {Promise<Packet>}
     */
    async __sendRequest(seqNum, data) {
        this.#assertOpen();
        const promise = new ExposedPromise();
        this.__requestHandles.set(seqNum, promise);
        this.__sock.send(data);
        return promise.promise;
    }

    /**
     * @param {string} blockId
     * @param {string} entryId
     * @returns {Promise<Entry | undefined>}
     */
    async getEntry(blockId, entryId) {
        this.#assertOpen();
        const block = await this.getBlock(blockId);
        if (block === undefined) return undefined;

        return await block.getEntryOrCreate(entryId);
    }

    /**
     * 
     * @param {string} identifier 
     * @returns {Promise<Block | undefined>}
     */
    async getBlock(identifier) {
        this.#assertOpen();
        if (typeof(identifier) !== "string") {
            throw new TypeError("Expected string");
        }

        let block = this.__blocks.get(identifier)
        if (block !== undefined) {
            if (block !== null) {
                return block;
            }


        }

        if (!this.__user.canAccess(identifier)) {
            return undefined;
        }

        block = new Block(identifier, this);
        this.__blocks.set(identifier, block);
        return block;
    }

    /**
     * 
     * @param {string} identifier 
     * @param {ArrayBuffer|null} payload 
     * @param {ArrayLike<Player>} [recipients] 
     * @returns {Promise<number>}
     */
    async sendBroadcast(identifier, payload, recipients) {
        this.#assertOpen();
        const seqNum = this.__sequenceNumber++;

        recipients = recipients || [];
        if (recipients.length > 1024) {
            throw new RangeError("Can address only up to 1024 recipients");
        }

        //TODO refactor this fuckery
        const idBuf = StringSerializer.instance.serlIdentifier(identifier);
        const writer = new BinaryWriter(SIZE_PacketHeader);
        PacketHeaderSerializer.instance.writeDirect(PacketEventType.BROADCAST, PacketMethod.REQUEST, seqNum,
            2 +
            idBuf.byteLength + 
            2 + 
            recipients.length * 16 +
            (payload?.byteLength || 0),
            writer);

        /** @type {Array<ReadonlyUint8Array>} */
        const targets = [];
        for (let i = 0; i < recipients.length; i++) {
            targets.push(recipients[i].token.value)
        }

        const targetLen = new Int16Array(1);
        targetLen[0] = targets.length;

        const idBufLen = new Int16Array(1);
        idBufLen[0] = idBuf.length;
        
        /** @type {BlobPart[]} */
        const blobParts = [
            writer.getWritten(), 
            targetLen, 
            ...targets, 
            idBufLen,
            idBuf];
        if (payload !== null) {
            blobParts.push(payload);
        }

        const resp = await this.__sendRequest(seqNum, new Blob(blobParts));

        if (resp.header.eventType !== PacketEventType.STATUS_CODE) {
            console.error("Broadcast response was not status code");
            return -1;
        }
        return new Uint8Array(resp.buffer)[0];
    }

    /**
     * 
     * @param {Block} block
     * @returns {Promise<number>}
     */
    async flushBlock(block) {
        this.#assertOpen();
        const release = await block._lock();
        const seqNum = this.__sequenceNumber++;
        const writer = new BinaryWriter(512);

        // header
        writer.offset += SIZE_PacketHeader;

        const blockId = StringSerializer.instance.serlBlockIdentifier(block.identifier);
        writer.writeInt16(blockId.length)
        writer.writeBytes(blockId);

        // absolute: False
        writer.writeUint8(0);

        const lenIndex = writer.offset;
        writer.offset += 2;

        let amount = 0;
        for (const entry of block._getDirtyEntries()) {
            if (typeof(entry) === "string") {
                const entryId = StringSerializer.instance.serlIdentifier(entry);
                writer.writeInt16(entryId.length);
                writer.writeBytes(entryId);
                writer.writeUint8(1);
            }
            else {
                const entryId = StringSerializer.instance.serlIdentifier(entry.identifier);
                writer.writeInt16(entryId.length);
                writer.writeBytes(entryId);
                writer.writeUint8(0);
                const buffer = await entry.get();
                writer.writeBytes(new Uint8Array(buffer));
            }
            amount++;
            if (amount > (2 ** 15) - 1) {
                throw new Error("Too many entries");
            }
        }

        const written = writer.offset;
        
        writer.offset = lenIndex;
        writer.writeInt16(amount);

        writer.offset = 0;
        PacketHeaderSerializer.instance.writeDirect(PacketEventType.BLOCK_UPDATE, PacketMethod.REQUEST, seqNum, written, writer);

        const resp = await this.__sendRequest(seqNum, writer.getWritten());

        if (resp.header.eventType !== PacketEventType.STATUS_CODE) {
            console.error("Broadcast response was not status code");
            return -1;
        }

        const code = new Uint8Array(resp.buffer)[0];
        if (code === 0) {
            block._clearDirty();
        }
        release();

        return code;
    }

    /** @type {<K extends keyof SocketCtxEventMap>(type: K, listener: (this: SocketCtx, ev: SocketCtxEventMap[K]) => any, options?: boolean | AddEventListenerOptions) => void} */
    addEventListener(type, listener, options) {
        //@ts-ignore: Type gymnastics
        this.__evt.addEventListener(type, listener, options);
    }

    /** @type {<K extends keyof SocketCtxEventMap>(type: K, listener: (this: SocketCtx, ev: SocketCtxEventMap[K]) => any, options?: boolean | EventListenerOptions) => void} */
    removeEventListener(type, listener) {
        //@ts-ignore: fuck off
        this.__evt.removeEventListener(type, listener);
    }
}

class SocketCtxEvent extends Event {
    /**
     * @param {import("./interfaces").SocketCtxEventEnum} type
     * @param {EventInit} [eventInitDict=undefined]
     */
    constructor(type, eventInitDict) {
        super(type, eventInitDict);
    }
}

class SocketBroadcastEvent extends SocketCtxEvent {
    /** @type {string} */ #identifier;
    /** @type {ArrayBuffer} */ #payload;

    /**
     * @param {string} identifier 
     * @param {ArrayBuffer} payload 
     * @param {EventInit} [eventInitDict=undefined]
     */
    constructor(identifier, payload, eventInitDict) {
        super("message", eventInitDict);
        this.#identifier = identifier;
        this.#payload = payload;
    }

    get identifier() {
        return this.#identifier;
    }

    get payload() {
        return this.#payload;
    }
}

class SocketUserJoinEvent extends SocketCtxEvent {
    /** @type {Player} */ #player;

    /**
     * @param {Player} player 
     * @param {EventInit} [eventInitDict=undefined]
     */
    constructor(player, eventInitDict) {
        super("userjoin", eventInitDict);
        this.#player = player;
    }

    get player() {
        return this.#player;
    }
}

class SocketUserUpdateEvent extends SocketCtxEvent {
    /** @type {User} */ #user;

    /**
     * @param {User} user 
     * @param {EventInit} [eventInitDict=undefined]
     */
    constructor(user, eventInitDict) {
        super("userupdate", eventInitDict);
        this.#user = user;
    }

    get user() {
        return this.#user;
    }
}

class SocketUserLeaveEvent extends SocketCtxEvent {
    /** @type {UserToken} */ #token;

    /**
     * @param {UserToken} token 
     * @param {EventInit} [eventInitDict=undefined]
     */
    constructor(token, eventInitDict) {
        super("userleave", eventInitDict);
        this.#token = token;
    }

    get token() {
        return this.#token;
    }
}

class SocketBlockUpdateEvent extends SocketCtxEvent {
    /** @type {Block} */ #block;

    /**
     * @param {Block} block 
     * @param {EventInit} [eventInitDict=undefined]
     */
    constructor(block, eventInitDict) {
        super("blockupdate", eventInitDict);
        this.#block = block;
    }

    get block() {
        return this.#block;
    }
}

class User {
    /** @type {UserToken} @readonly */ __token;
    /** @type {string} */ _nickname;
    /** @type {boolean} */ _admin;
    /** @type {Set<string>} */ _blockAccess;

    /**
     * @param {UserToken} token 
     * @param {string} nickname 
     * @param {boolean} admin 
     * @param {Set<string>} blockAccess 
     */
    constructor(token, nickname, admin, blockAccess) {
        this.__token = token;
        this._nickname = nickname;
        this._admin = admin;
        this._blockAccess = blockAccess;
    }

    /**
     * @param {string} block 
     */
    canAccess(block) {
        return this._admin || this._blockAccess.has(block);
    }

    /**
     * @param {UserToken} token 
     */
    is(token) {

    }
    
    get token() {
        return this.__token
    }

    get nickname() {
        return this.nickname;
    }

    get admin() {
        return this._admin;
    }
    
    get accessibleBlocks() {
        return this._blockAccess.values();
    }
}

class UserToken {
    /** @type {ReadonlyUint8Array} @readonly */ #value;
    /** @type {bigint} @readonly */ #bigint;

    /**
     * @param {ReadonlyUint8Array} value 
     */
    constructor(value) {
        if (value.length !== 16) {
            throw new Error("UserToken must be exactly 16 bytes long");
        }
        this.#value = value;
        this.#bigint = 
              BigInt(value[0] << 24 | value[1] << 16 | value[2] << 8 | value[3]) << 92n
            | BigInt(value[4] << 24 | value[5] << 16 | value[6] << 8 | value[7]) << 64n
            | BigInt(value[8] << 24 | value[9] << 16 | value[10] << 8 | value[11]) << 32n
            | BigInt(value[12] << 24 | value[13] << 16 | value[14] << 8 | value[15]);
    }

    get value() {
        return this.#value;
    }

    get bigint() {
        return this.#bigint;
    }

    /**
     * @param {UserToken} other 
     */
    equals(other) {
        //@ts-ignore: Type gymnastics
        return Uint8Compare(this.#value, other.#value);
    }
}

class Player {
    /** @type {UserToken} */ #token;
    /** @type {string} */ _nickname;

    /**
     * @param {UserToken} token 
     * @param {string} nickname 
     */
    constructor(token, nickname) {
        this.#token = token;
        this._nickname = nickname;
    }

    get token() {
        return this.#token;
    }

    get nickname() {
        return this._nickname;
    }
}

export {
    SocketCtx,
    Packet,
    PacketHeader,
    User,
    UserToken,
    SocketBroadcastEvent,
    SocketUserJoinEvent,
    SocketUserLeaveEvent,
    SocketUserUpdateEvent,
    SocketBlockUpdateEvent,
    PacketEventType,
    PacketMethod
}