require('prototype_creep');
require('prototype_harvester');

module.exports.loop = function () {
    for(var name in Game.creeps) {
        Game.creeps[name].run();
    }
    let spawn = Game.spawns['Spawn1'];
    if (spawn.energy >= 250) {
        spawn.createCreep([MOVE,CARRY,CARRY,WORK],undefined,{role:'harvester',task:null});
    }
}
