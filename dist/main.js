require('prototype_creep');
require('prototype_spawner');
let manager = require('manager');
let spawnModule = require('spawn');
//apples
module.exports.loop = function() {
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {


            let creep = Memory.creeps[name];
            if (creep.role == 'miner') {
                let managerId  = 0;
                let manager = Memory.manager[managerId];
                for (let key in manager.sources) {
                    let index = manager.sources[key].miners.indexOf(name);
                    if (index != -1) {
                        Memory.manager[managerId].sources[key].miners.splice(index, 1)
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
    let managers = []
    for (let key in Memory.manager) {
        managers[key] = new manager(0);
        managers[key].init();
    }

    for (let key in managers) {
        managers[key].run();
    }

    for (var name in Game.creeps) {
        Game.creeps[name].run();
    }
}
