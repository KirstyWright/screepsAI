require('prototype_creep');
require('prototype_spawner');
let stats = require('stats');
let manager = require('manager');
//apples
module.exports.loop = function() {
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
            "room": Game.spawns['Spawn1'].room.name
        }];
    }

    let managers = [];
    for (let key in Memory.manager) {
        managers[key] = new manager(0);
        managers[key].init();
    }

    for (let key in managers) {
        managers[key].run();
    }

    for (let name in Game.creeps) {
        Game.creeps[name].run();
    }

    stats.exportStats();
};
