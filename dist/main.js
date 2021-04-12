require('prototype_creep');
require('prototype_spawner');
let build = require('build');
let spawnModule = require('spawn');
let miningModule = require('mining');
//apples
module.exports.loop = function() {
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    for (var name in Game.creeps) {
        Game.creeps[name].run();
    }

    let spawn = Game.spawns['Spawn1'];
    build.run(spawn);
    miningModule.run(spawn);
    spawnModule.run(spawn);
    spawn.attemptSpawning();
}
