#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';

const program = new Command();
program
    .version("0.1.0")
    .description("golem wasm packing tool");
program
    .option('-d, --debug', 'output extra debugging')
    .option('-s, --small', 'small pizza size')
    .option('-p, --pizza-type <type>', 'flavour of pizza');

program.parse(process.argv);

if (program.debug) console.log(program.opts());
console.log('pizza details:');
if (program.small) console.log('- small pizza size');
if (program.pizzaType) console.log(`- ${program.pizzaType}`);

console.log(
    chalk.bold.green('test')
);