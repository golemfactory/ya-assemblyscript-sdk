#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import {readFileSync, writeFileSync} from 'fs'
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {loadManifest, MainEntry} from "./manifest";
import assert, {throws} from "assert";
import {hashFile} from "./hash";
import Zip from 'jszip';
import { promisify } from "util";
import * as fs from "fs";
import {lookupRepo, uploadImage} from "./repo";
import asc from 'assemblyscript/cli/asc';


const DEFAULT_MANIFEST_FN = "asmanifest.json";

const program = new Command();
program
    .version("0.1.0")
    .description("golem wasm packing tool");
program
    .option('-d, --debug', 'output extra debugging')

program
    .command("init [manifest]")
    .description("generates empty manifest")
    .action(cmd_init);

program
    .command("pack [manifest]")
    .option('-o, --output <output-dir>', "package output directory")
    .option('-b --build', 'pushes generated image to repo')
    .option('--push', 'pushes generated image to repo')
    .action(cmd_pack);

program
    .command("build [module-file]")
    .description("runs asc - assemblyscript compiler")
    .action(cmd_build);

function cmd_init(manifest_file_name : string = DEFAULT_MANIFEST_FN) {
    let packages = JSON.parse(readFileSync("package.json", {encoding: 'utf-8'}))
    let manifest = {
        id: uuidv4(),
        name: packages.name,
        runtime: "aswasm",
        main: {
            "wasm-path": "./build/optimized.wasm"
        },
        "entry-points": {}
    }
    console.log(`Generating file: ${chalk.italic(manifest_file_name)}`);
    writeFileSync(manifest_file_name, JSON.stringify(manifest, undefined, 4), {encoding: 'utf-8'});
    console.log('done.');
}

async function cmd_pack(manifest_file_name : string = DEFAULT_MANIFEST_FN, opts: {output?: string, push:boolean, build: boolean}) {
    const manifest = await loadManifest(manifest_file_name);
    assert(manifest.main, "missing main entrypoint");
    const wasm_path = manifest.main["wasm-path"];

    if (opts.build) {
        await cmd_build();
    }

    const hash = (await hashFile(wasm_path)).toString('hex').slice(0, 12);
    const app_file_name = `app-${hash}.wasm`;
    const new_main : MainEntry = {
        "wasm-path": app_file_name
    };
    const zero_date = new Date(0);
    const new_manifest = {...manifest, main: new_main};
    const zip_file = new Zip();
    zip_file.file("manifest.json", JSON.stringify(new_manifest, undefined, 4), {date: zero_date});
    zip_file.file(app_file_name, fs.createReadStream(wasm_path), {compression: "DEFLATE", date: zero_date});
    const output_file = "build/output.ywasm";

    await new Promise((onOk, onErr) => {
        let f = zip_file.generateNodeStream().pipe(fs.createWriteStream(output_file));
        f.on('data', () => console.log('chunk'));
        f.on('finish', () => onOk())
        f.on('error', (e) => onErr(e))
    });
    console.log(`Pack ${chalk.italic(wasm_path)} -> ${chalk.italic(output_file)}`);
    if (opts.push) {
        const url = await uploadImage('app', output_file)
        console.log(`Uploaded to: ${url}`)
    }
}

async function cmd_build(module_file = "assembly/index.ts") {
    const binary_output = "build/optimized.wasm";
    await asc.ready;
    console.log(`Building ${chalk.italic(module_file)}`)
    const ret_code = asc.main([
        module_file,
        "--binaryFile", binary_output,
        "--textFile", "build/optimized.wat",
        "--optimize"
    ], {stdout: process.stdout, stderr: process.stderr});
    if (ret_code != 0) {
        process.exit(ret_code);
    }
    console.log(`Generated ${chalk.italic(binary_output)}`)
}

program.parseAsync(process.argv).then(() => program.usage());

