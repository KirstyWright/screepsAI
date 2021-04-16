require('prototype_creep');
require('prototype_spawner');
let build = require('build');
let spawnModule = require('spawn');
let miningModule = require('mining');
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

    for (var name in Game.creeps) {
        Game.creeps[name].run();
    }

    let spawn = Game.spawns['Spawn1'];
    build.run(spawn);
    miningModule.run(spawn);
    spawnModule.run(spawn);
    spawn.attemptSpawning();

}
