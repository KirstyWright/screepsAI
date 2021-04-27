import "prototype_creep";
import "prototype_spawner";
import { ErrorMapper } from "utils/ErrorMapper";
import { Manager } from "manager";
// require("prototype_creep.ts");
// require("prototype_spawner.ts");


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



// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {

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
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    //
    // Memory.manager = [{
    //     sources: [
    //         {
    //             miners: [],
    //             pos: new RoomPosition(7, 26, "W42N29"),
    //             sourceId: "5bbcaab69099fc012e6320da"
    //         },
    //         {
    //             miners: [],
    //             pos: new RoomPosition(24, 11, "W43N29"),
    //             sourceId: "5bbcaaab9099fc012e631f51"
    //         },
    //         {
    //             miners: [],
    //             pos: new RoomPosition(37, 13, "W43N29"),
    //             sourceId: "5bbcaaab9099fc012e631f52"
    //         },
    //     ]
    // }]
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

    let managers: Manager[] = [];
    for (let key in Memory.manager) {
        managers[key] = new Manager(0);
        managers[key].init();
    }

    for (let key in managers) {
        managers[key].run();
    }

    for (let name in Game.creeps) {
        if (Game.creeps[name].memory.managerId != undefined) {
            Game.creeps[name].manager = managers[Game.creeps[name].memory.managerId];
        }
        Game.creeps[name].run();
    }

    for (let key in managers) {
        managers[key].finish();
    }
    // exportStats();

    if (Game.cpu.bucket >= 10000) {
        Game.cpu.generatePixel();
    }

});
