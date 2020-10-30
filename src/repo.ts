import {promisify} from "util";
import { resolveSrv as _resolveSrv, SrvRecord } from 'dns';
import {randomInt} from "crypto";
import assert from "assert";
import fetch from 'node-fetch';
import {hashFile} from "./hash";
import * as fs from "fs";
import {createReadStream} from "fs";

const resolveSrv = promisify(_resolveSrv);

function recordAt(val: number, records : SrvRecord[], offset : number) {
    const init_val = val;
    for (let i=offset; i<records.length; ++i) {
        const record = records[i];
        if (record.weight > val) {
            return i;
        }
        val -= record.weight;
    }
    assert(false,
        `recordAt called with value:${init_val} > total_weight, offset=${offset}, len=${records.length}, w=${records[offset].weight}`)
}

function shuffle(records : SrvRecord[]) {
    let total_weight = records.reduce((total_weight, record) => total_weight+record.weight, 0);
    for (let idx=0; idx<records.length; ++idx) {
        let randIdx = recordAt(randomInt(total_weight), records, idx);
        if (idx != randIdx) {
            [records[idx], records[randIdx]] = [records[randIdx], records[idx]]
        }
        total_weight -= records[idx].weight;
    }
}

export function shuffleRecords(records : SrvRecord[]): SrvRecord[] {
    records.sort((a,b) => a.priority - b.priority);
    let current : SrvRecord[] = [];
    let all : SrvRecord[] = [];
    for (const record of records) {
        if (current.length > 0) {
            if (current[0].priority == record.priority) {
                current.push(record);
            }
            else {
                shuffle(current);
                all = [...all, ...  current ]
                current = [record]
            }
        }
        else {
            current.push(record)
        }
    }
    shuffle(current);
    return [...all, ...  current ]
}

async function status(host : string, port :number): Promise<string | null> {
    try {
        const base_url = `http://${host}:${port}`;
        const r = await fetch(`${base_url}/status`);
        if (r.status === 200) {
            return base_url;
        }
    }
    catch (e) {

    }
    return null;
}

export async function lookupRepo(domain: string = 'dev.golem.network', service = '_girepo._tcp'): Promise<string | null> {
    const addresses = shuffleRecords(await resolveSrv(`${service}.${domain}`));
    for (const address of addresses) {
        const base_url = await status(address.name, address.port);
        if (base_url) {
            return base_url
        }
    }
    return null;
}

export async function uploadImage(base_name: string, path: fs.PathLike, domain: string = 'dev.golem.network') : Promise<string | null> {
    const sha3_hash = (await hashFile(path)).toString('hex');
    let image_name = `${base_name}-${sha3_hash.slice(0, 20)}.ywasm`;
    const base_url = await lookupRepo(domain);
    if (base_url == null) {
        return null;
    }

    let download_url = `${base_url}/${image_name}`;
    const upload_result = await fetch(`${base_url}/upload/${image_name}`,{method: 'PUT', body: createReadStream(path)});
    assert(upload_result.status == 200, "upload success");
    const link_upload_result = await fetch(`${base_url}/upload/image.${sha3_hash}.link`, {method: 'PUT', body: download_url})
    assert(upload_result.status == 200, "upload link success");
    return `${sha3_hash}`
}