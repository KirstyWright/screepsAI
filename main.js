require('prototype_creep');

module.exports.loop = function () {
    for(var name in Game.creeps) {
        Game.creeps[name].run();
    }
    let spawn = Game.spawns['Spawn1'];
    if (spawn.energy >= 250) {
        if (_.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' ).length < (spawn.room.find(FIND_SOURCES).length * 2)) {
            spawn.createCreep([MOVE,CARRY,CARRY,WORK],undefined,{role:'harvester',task:null});
        } else if (_.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader' ).length < 2 && spawn.energy >= 300) {
            spawn.createCreep([MOVE,CARRY,WORK,WORK],undefined,{role:'upgrader',task:null});
        } else if (_.filter(Game.creeps, (creep) => creep.memory.role == 'builder' ).length < 2 && spawn.energy >= 300) {
            spawn.createCreep([MOVE,CARRY,WORK,WORK],undefined,{role:'builder',task:null});
        }
    }
}
