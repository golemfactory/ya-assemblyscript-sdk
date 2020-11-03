import {SrvRecord} from 'dns';
import {shuffleRecords} from '../src/repo'

describe('shuffleRecords', function () {
    let r = shuffleRecords([
        {priority: 13, weight: 1, name: "a3", port: 0},
        {priority: 10, weight: 10, name: "n1", port: 0},
        {priority: 13, weight: 1, name: "a2", port: 0},
        {priority: 10, weight: 10, name: "n2", port: 0},
        {priority: 10, weight: 8, name: "n3", port: 0},
        {priority: 5, weight: 10, name: "m", port: 0},
        {priority: 13, weight: 10, name: "a1", port: 0},
    ]);
    //console.log('r', r);
    it("lowest priority first", function () {
        expect(r[0]).toEqual({priority: 5, weight: 10, name: "m", port: 0});
    })

    it('records random distributed', function () {
        let r = [
            {priority: 13, weight: 10, name: "a1", port: 0},
            {priority: 13, weight: 2, name: "a2", port: 0},
            {priority: 13, weight: 1, name: "a3", port: 0}
        ];
        let stats = new Map();
        const total = 5000;
        for (let i = 0; i < total; ++i) {
            const cr = shuffleRecords(r);

            const name = cr[0].name;
            stats.set(name, (stats.get(name) || 0) + 1);
        }
        for (const record of r) {
            const expected = total * record.weight / 13.0;
            const current = stats.get(record.name) || 0;
            const error = Math.abs(expected - current);
            //console.log('expected', expected, 'current', current, 'error', error);
            expect(error).toBeLessThanOrEqual(total / 50);
        }
        //console.log('stats', stats);

    });


});

