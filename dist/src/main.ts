import "prototype_creep";
import "prototype_spawner";
import { ErrorMapper } from "utils/ErrorMapper";
import { Manager } from "manager";
import { Stats } from "stats";
import { Directive } from "directive";
// require("prototype_creep.ts");
// require("prototype_spawner.ts");
// declare var profiler: any;
import * as profiler from './screeps-profiler';

String.prototype.hashCode = function() {
    var hash = 0;
    if (this.length == 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

// var global: Global = {
//     managers: [],
//     directives: [],
// };
declare var global: Global;
global.managers = [];
global.directives = [];

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
profiler.enable();
export const loop = ErrorMapper.wrapLoop(() => {
    profiler.wrap(function() {
        for (var name in Memory.creeps) {
            if (!Game.creeps[name]) {


                let creep = Memory.creeps[name];
                if (creep.role == 'miner') {
                    if (creep.managerId === undefined) {
                        creep.managerId = 0;
                    }
                    let manager = Memory.manager[creep.managerId];
                    for (let key in manager.sources) {
                        let index = manager.sources[key].miners.indexOf(name);
                        if (index != -1) {
                            manager.sources[key].miners.splice(index, 1);
                        }
                    }
                }

                delete Memory.creeps[name];
            }
        }

        if (!Memory.manager || Memory.manager.length == 0) {
            if (Game.spawns['Spawn1'] == undefined) {
                return;
            }
            Memory.manager = [{
                "room": Game.spawns['Spawn1'].room.name,
                "sources": [],
                "rooms": [],
                "creeps": [],
                "spawnQueue": []
            }];
        }

        for (let key in Memory.manager) {
            global.managers[key] = new Manager(0);
            global.managers[key].init();
        }

        let flags: Flag[] = Object.values(Game.flags);
        flags.forEach(flag => {
            let directive = new Directive(flag, global);
            directive.init();
            global.directives.push(directive);
        });


        // RUN

        global.directives.forEach(directive => {
            directive.run();
        });

        for (let key in global.managers) {
            global.managers[key].run();
        }

        for (let name in Game.creeps) {
            if (Game.creeps[name].memory.managerId != undefined) {
                Game.creeps[name].manager = global.managers[Game.creeps[name].memory.managerId];
            }
            Game.creeps[name].run();
        }

        for (let key in global.managers) {
            global.managers[key].finish();
        }
        Stats.exportStats(global.managers);

        if (Game.cpu.bucket >= 10000) {
            Game.cpu.generatePixel();
        }
    });
});
