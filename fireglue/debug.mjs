import * as binary from "./binary.mjs"
import * as errors from "./errors.mjs"
import * as kvstore from "./kvstore.mjs"
import * as socket from "./socket.mjs"
import * as utils from "./utils.mjs"

globalThis.binary = binary;
globalThis.errors = errors;
globalThis.kvstore = kvstore;
globalThis.socket = socket;
globalThis.utils = utils;

globalThis.ctx = new socket.SocketCtx();
ctx.addEventListener("message", (ev) => {
    console.log("message", ev.identifier, new Uint8Array(ev.payload));
});
ctx.addEventListener("userjoin", (ev) => {
    console.log("join", ev.player.nickname, ev.player.token.bigint);
});
ctx.addEventListener("userleave", (ev) => {
    console.log("leave", ev.token.bigint);
});
ctx.addEventListener("userupdate", (ev) => {
    console.log("user update", ev.user);
});
ctx.addEventListener("blockupdate", (ev) => {
    console.log("block update", ev.block);
});

await ctx.connect("localhost:8989", 'user-' + String(Math.trunc(Math.random() * 1000)), '', true);
console.log("Connected as", ctx.__user._nickname, ctx.__user._admin ? "admin" : "user", "access", Array.from(ctx.__user._blockAccess))