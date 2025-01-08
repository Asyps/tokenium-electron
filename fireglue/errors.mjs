//@ts-check
class ArgumentError extends Error {
    /**
     * @param {string} message
     * @param {number} index
     * @param {ErrorOptions} options
     */
    constructor(message, index, options) {
        super(`Invalid argument at index ${index}: ${message}`, options);
    }

    /**
     * Unwraps this ArgumentError and returns the inner Error
     * @returns {Error}
     */
    unwrap() {
        assertInstance(this.cause, Error);
        //@ts-ignore: Type checked
        return this.cause;
    }

    /**
     * Wraps an `Error` into a `ArgumentError` at a specified index
     * @param {Error} error
     * @param {number} index
     * @returns {ArgumentError}
     */
    static wrap(error, index) {
        assertType(index, "number");
        return new ArgumentError(error.message, index, { cause: error });
    }
}

class AbstractImplementationError extends Error {
    constructor() {
        super("Not implemented")
    }
}

class Typ extends Error {
    /**
     * @param {string} expected
     * @param {string} received
     */
    constructor(expected, received) {
        super();
    }
}

class NullValueError extends Error {
    constructor() {
        super("Value can not be null");
    }
}

/**
 * Throws a `TypeError` if `typeof(value) !== type`
 * @param {any} value
 * @param {"string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"} type
 */
function assertType(value, type) {
    const expected = type;
    const actual = typeof value;
    if (expected !== actual) {
        throw new TypeError(`Expected type '${expected}', received '${actual}'`);
    }
}

/**
 * Throws an `ArgumentError` wrapping  `TypeError` if `typeof(value) !== type`
 * @param {any} value
 * @param {"string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"} type
 * @param {number} index
 */
function assertArgType(value, type, index) {
    const expected = type;
    const actual = typeof value;
    if (expected !== actual) {
        throw ArgumentError.wrap(
            new TypeError(`Expected type '${expected}', received '${actual}'`),
            index,
        );
    }
}

/**
 * Throws a `TypeError` if `(value instanceof type) === false`
 * @param {any} value
 * @param {object} type
 */
function assertInstance(value, type) {
    if (!(value instanceof type)) {
        throw new TypeError(`Expected type '${String(type.prototype)}', received '${String(Object.getPrototypeOf(value))}'`);
    }
}

/**
 * Throws an `ArgumentError` wrapping `TypeError` if `(value instanceof type) === false`
 * @param {any} value
 * @param {object} type
 * @param {number} index
 */
function assertArgInstance(value, type, index) {
    if (!(value instanceof type)) {
        throw ArgumentError.wrap(
            new TypeError(`Expected type '${String(type.prototype)}', received '${String(Object.getPrototypeOf(value))}'`),
            index
        );
    }
}

/**
 * Throws a `NullValueError` if `value` is null
 * @param {any} value
 */
function assertNotNull(value) {
    if (value === null) {
        throw new NullValueError();
    }
}

/**
 * Throws an `ArgumentError` wrapping `NullValueError` if `value` is null
 * @param {any} value
 * @param {number} index
 */
function assertArgNotNull(value, index) {
    if (value === null) {
        throw ArgumentError.wrap(new NullValueError(), index);
    }
}

/**
 * Throws a `RangeError` if `value < lower` and `lower` is defined, or if `value > upper` and `upper` is defined
 * @param {number} value 
 * @param {number|undefined} lower 
 * @param {number|undefined} upper 
 */
function assertRange(value, lower, upper) {
    if (typeof(lower) !== "undefined" && value < lower) {
        throw new RangeError(`${value} is smaller than ${lower}`);
    }
    if (typeof(upper) !== "undefined" && value > upper) {
        throw new RangeError(`${value} is larger than ${upper}`);
    }
} 

/**
 * Throws a `RangeError` if `value < lower` and `lower` is defined, or if `value > upper` and `upper` is defined
 * @param {number} value 
 * @param {number|undefined} lower 
 * @param {number|undefined} upper 
 */
function assertArgRange(value, lower, upper, index) {
    if (typeof(lower) !== "undefined" && value < lower) {
        throw ArgumentError.wrap(new RangeError(`${value} is smaller than ${lower}`), index);
    }
    if (typeof(upper) !== "undefined" && value > upper) {
        throw ArgumentError.wrap(new RangeError(`${value} is larger than ${upper}`), index);
    }
} 

export {
    assertArgInstance,
    assertArgNotNull,
    assertArgType,
    assertInstance,
    assertNotNull,
    assertType,
    assertArgRange,
    assertRange,
    ArgumentError,
    NullValueError,
    AbstractImplementationError
};
