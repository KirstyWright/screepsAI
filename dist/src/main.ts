import "prototype_creep";
import "prototype_spawner";
import { ErrorMapper } from "utils/ErrorMapper";
import { Manager } from "manager";
import { Stats } from "stats";
import { Directive } from "directive";
import { Cache } from "./cache/cache";
import "Traveler";

// declare var profiler: any;
import * as profiler from './screeps-profiler';
import { Tick } from "Tick";

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

var global = {
    cache: new Cache()
}
console.log("Global refreshed, rebuilding cache");
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
                        console.log('Miner didn\'t have a manager at spawn');
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
        Tick.managers = [];
        Tick.directives = [];
        Tick.Profiler = null;
        Tick.routes = {}

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
            Tick.managers[key] = new Manager(0);
            Tick.managers[key].init();
        }
        let flags: Flag[] = Object.values(Game.flags);
        flags.forEach(flag => {
            let directive = new Directive(flag);
            directive.init();
            Tick.directives.push(directive);
        });

        // RUN

        Tick.directives.forEach(directive => {
            directive.run();
        });

        for (let key in Tick.managers) {
            Tick.managers[key].run();
        }
        for (let name in Game.creeps) {
            if (Game.creeps[name].memory.managerId != undefined) {
                Game.creeps[name].manager = Tick.managers[Game.creeps[name].memory.managerId];
            }
            Game.creeps[name].run();
        }

        for (let key in Tick.managers) {
            Tick.managers[key].finish();
        }
        Stats.exportStats(Tick.managers);

        if (Game.cpu.bucket >= 10000) {
            if ("generatePixel" in Game.cpu) {
                Game.cpu.generatePixel();
            }
        }
    });
});
