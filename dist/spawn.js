module.exports = {
    roles: {
        'harvester': {
            250: [MOVE, CARRY, CARRY, WORK],
            450: [MOVE, WORK, WORK, CARRY, CARRY, CARRY, CARRY],
            550: [MOVE, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY]
        },
        'builder': {
            250: [MOVE, CARRY, WORK, WORK]
        },
        'upgrader': {
            250: [MOVE, CARRY, WORK, WORK]
        }
    },
    getWhichCreepToSpawn: function(Spawner) {
        // Not sure if ln 18 is valid
        let parts = false;
        if (_.filter(Spawner.room.creeps, (creep) => creep.memory.role == 'harvester').length < (spawn.room.find(FIND_SOURCES).length * 2)) {
        }
        // Harvester check
        // Upgrader check
        // Builder check
    },
    getWhichCreepTierToSpawn: function(energyAvailable, role) {

    }
    spawnCreep: function(Spawner) {
        let parts = this.getWhichCreepToSpawn(Spawner);
    }
}
