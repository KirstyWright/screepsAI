module.exports = {
    run: function(spawn) {
        if (spawn.room.memory.spawnQueue == undefined) {
            spawn.room.memory.spawnQueue = [];
        }
        this.getWhichCreepToSpawn(Game.spawns['Spawn1']);
        //TODO: emergency harvester check
    },
    getWhichCreepToSpawn: function(Spawner) {
        let parts = false;
        if (_.filter(Spawner.room.creeps, (creep) => creep.memory.role == 'harvester').length < 4) {
            if (_.filter(Spawner.room.memory.spawnQueue, (creep) => creep.data.role == 'harvester') < 1) {
                Spawner.queueCreep({
                    role:'harvester'
                });
                console.log('Spawner queueing harvester');
            }
        }

        if (_.filter(Spawner.room.creeps, (creep) => creep.memory.role == 'upgrader').length < 2) {
            if (_.filter(Spawner.room.memory.spawnQueue, (creep) => creep.data.role == 'harvester') < 1) {
                Spawner.queueCreep({
                    role:'upgrader'
                });
                console.log('Spawner queueing upgrader');
            }
        }
        if (_.filter(Spawner.room.creeps, (creep) => creep.memory.role == 'builder').length < 2) {
            if (_.filter(Spawner.room.memory.spawnQueue, (creep) => creep.data.role == 'harvester') < 1) {
                Spawner.queueCreep({
                    role:'builder'
                });
                console.log('Spawner queueing builder');
            }
        }

        // Harvester check
        // Upgrader check
        // Builder check
    },
    getWhichCreepTierToSpawn: function(energyAvailable, role) {

    },
    spawnCreep: function(Spawner) {
        let parts = this.getWhichCreepToSpawn(Spawner);
    }
}
