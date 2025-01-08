/**
 * @template T
 * @typedef { import("./interfaces").PromiseResolve<T> } PromiseResolve<T>
 */

/**
 * @typedef { import("./interfaces").PromiseReject } PromiseReject
 */

/**
 * @param {Uint8Array} lhs
 * @param {Uint8Array} rhs
 * @returns {boolean}
 */
function Uint8Compare(lhs, rhs) {
    if (lhs == rhs)
        return true;
    if (lhs.length !== rhs.length)
        return false;
    for (let index = 0; index < lhs.length; index++) {
        if (lhs[index] !== rhs[index]) {
            return false;
        }
    }
    return true;
}

/**
 * @template T
 */
class ExposedPromise {
    /** @type {Promise<T>} */ #promise;
    /** @type {PromiseResolve<T>} */ #resolve;
    /** @type {PromiseReject} */ #reject;

    constructor() {
        let s, e;
        this.#promise = new Promise((resolve, reject) => {
            s = resolve;
            e = reject;
        });
        //@ts-ignore
        this.#resolve = s;
        //@ts-ignore
        this.#reject = e;
    }

    get promise() {
        return this.#promise;
    }
    
    get resolve() {
        return this.#resolve;
    }

    get reject() {
        return this.#reject;
    }
}

/**
 * 
 * @param {ArrayBuffer} src
 * @returns {ArrayBuffer} 
 */
function cloneBuffer(src) {
    const dst = new ArrayBuffer(src.byteLength);
    new Uint8Array(dst).set(new Uint8Array(src));
    return dst;
}

class Mutex {
    /** @type {ExposedPromise<() => void>[]} */ #queue = [];
    /** @type {boolean} */ #locked = false;

    /**
     * @returns {Promise<() => void>}
     */
    async acquire() {
        if (!this.#locked) {
            this.#locked = true;
            return this.#release.bind(this);
        }
        const promise = new ExposedPromise();
        this.#queue.push(promise);
        return promise.promise;
    }

    #release() {
        if (this.#queue.length !== 0) {
            this.#queue.shift()?.resolve(this.#release.bind(this));
            return;
        }
        this.#locked = false;
    }
}

export { 
    Uint8Compare,
    ExposedPromise,
    Mutex,
    cloneBuffer
};