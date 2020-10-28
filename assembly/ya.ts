
@unmanaged export class GolemCtx {
    nonce : u64
    ethAddress : string 

    constructor(nonce : u64, ethAddress : string) {
      this.nonce = nonce;
      this.ethAddress = ethAddress;
    }
}

export declare function context(): GolemCtx; 
export declare function log(message : string) : void;

@final export class PrivateKey {
  bytes : ArrayBuffer

  constructor() {
    this.bytes = eth.newKey()
    log("bytes: " + this.bytes.byteLength.toString())
  }

  address() : string {
    return eth.prvToAddress(this.bytes)
  }

  sign(message: ArrayBuffer): ArrayBuffer {
    return eth.sign(self.bytes, message);
  }

  sign_str(message: string): ArrayBuffer {
    return this.sign(String.UTF8.encode(message));
  }

}


export declare namespace eth {
  export function newKey(): ArrayBuffer;
  export function prvToAddress(pk: ArrayBuffer): string;
  export function pubToAddress(pubK: ArrayBuffer): string;
  export function sign(pk: ArrayBuffer, message: ArrayBuffer): ArrayBuffer;
  export function keccak256(bytes : ArrayBuffer): ArrayBuffer;
  // 
  // messageHash - 32 message hash,
  // signarure - 32 bytes R, 32 bytes S, 1 byte recovery tag.
  // returns 64 bytes public key.
  export function ecrecover(messageHash: ArrayBuffer, signature: ArrayBuffer): ArrayBuffer;
  export function bytesToHex(bytes: ArrayBuffer): string;

  export function sharedSecret(prvKey: ArrayBuffer, pubKey: ArrayBuffer): ArrayBuffer;
}

export declare namespace io {
  export function wopen(path: string) : anyref;
  export function ropen(path: string) : anyref;
  export function write(fd: anyref, bytes : ArrayBuffer) : i32;
  export function read(fd: anyref, bytes : ArrayBuffer) : i32;
  export function close(fd: anyref) : void;
}


