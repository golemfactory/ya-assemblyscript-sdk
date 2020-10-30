
import fs from 'fs'
import sha3 from 'sha3';
import assert from "assert";

export function hashFile(path : fs.PathLike) : Promise<Buffer> {
    return new Promise<Buffer>((onOk, onErr) => {
        const hasher = new sha3(224);
        fs.createReadStream(path).on("data", (chunk) => {
            assert(Buffer.isBuffer(chunk));
            hasher.update(chunk)
        }).on("end", () => {
            onOk(hasher.digest())
        })
    })
}