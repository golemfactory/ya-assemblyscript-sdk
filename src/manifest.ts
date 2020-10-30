import fs from "fs";

export function loadManifest(path: fs.PathLike) : Promise<Manifest> {
    return new Promise<Manifest>((resolveOk, resolveError) => {
        fs.readFile(path, {encoding: "utf-8" }, (err, data) => {
            if (err) {
                resolveError(err)
            }
            else {
                resolveOk(JSON.parse(data))
            }
        })
    })
}

export interface Manifest {
    id: string,
    name: string,
    runtime: "aswasm" | "wasi"
    main? : MainEntry,
    ["entry-points"]: Map<string, RunEntry>
}

export interface MainEntry {
    ["wasm-path"] : string
}

interface RunEntry {
    desc?: string,
    args: Array<ArgDef>,
    output?: "error-code" | "bytes" | "string" | "void"
}

interface ArgDef {
    name?: string,
    type: "string" | "bytes" | "i32" | "f64",
    fixed?: number
}