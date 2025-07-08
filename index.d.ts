/// <reference types="node" />

import { Buffer } from "buffer";

declare class Package {
    static readonly TYPE_HANDSHAKE: 1;
    static readonly TYPE_HANDSHAKE_ACK: 2;
    static readonly TYPE_HEARTBEAT: 3;
    static readonly TYPE_DATA: 4;
    static readonly TYPE_KICK: 5;

    /**
     * Package protocol encode.
     *
     * @param type package type
     * @param body body content in bytes
     * @return new byte array that contains encode result
     */
    static encode(type: number, body?: Buffer): Buffer;

    /**
     * Package protocol decode.
     *
     * @param buffer byte array containing package content
     * @return A single decoded package or an array of packages
     */
    static decode(buffer: Buffer | ArrayBuffer): { type: number; body: Buffer | null; } | { type: number; body: Buffer | null; }[];
}

declare class Message {
    static readonly TYPE_REQUEST: 0;
    static readonly TYPE_NOTIFY: 1;
    static readonly TYPE_RESPONSE: 2;
    static readonly TYPE_PUSH: 3;

    /**
     * Message protocol encode.
     *
     * @param id message id
     * @param type message type
     * @param compressRoute whether compress route
     * @param route route code or route string
     * @param msg message body bytes
     * @param compressGzip whether compress body with gzip
     * @return encode result
     */
    static encode(id: number, type: number, compressRoute: boolean, route: string | number, msg?: Buffer, compressGzip?: boolean): Buffer;

    /**
     * Message protocol decode.
     *
     * @param buffer message bytes
     * @return message object
     */
    static decode(buffer: Buffer | Uint8Array): {
        id: number;
        type: number;
        compressRoute: boolean;
        route: string | number | null;
        body: Buffer;
        compressGzip: boolean;
    };
}

declare class Protocol {
    static Package: typeof Package;
    static Message: typeof Message;
    
    /**
     * Protocol buffer encode
     * @param str string to encode
     */
    static strencode(str: string): Buffer;
    
    /**
     * Protocol buffer decode
     * @param buffer buffer to decode
     */
    static strdecode(buffer: Buffer): string;
}

export = Protocol; 