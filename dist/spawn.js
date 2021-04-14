module.exports = {
    run: function(spawn) {
        if (spawn.room.memory.spawnQueue == undefined) {
            spawn.room.memory.spawnQueue = [];
        }
        this.getWhichCreepToSpawn(spawn);
        //TODO: emergency harvester check
    },
    getWhichCreepToSpawn: function(Spawner) {
        let parts = false;
        let roles = {
            harvester: 0,
            builder: 0,
            upgrader: 0,
            miner: 0,
            hauler: 0
        }
        let creepsInRoom = Spawner.room.find(FIND_MY_CREEPS);
        for (key in creepsInRoom) {
            let creep = creepsInRoom[key];
            roles[creep.memory.role] = roles[creep.memory.role] + 1;
        }
        for (key in Spawner.room.memory.spawnQueue) {
            let role = Spawner.room.memory.spawnQueue[key].data.role;
            roles[role] = roles[role] + 1;
        }

        for (key in roles) {
            // console.log(key + ':' + roles[key]);
        }
        if (roles['harvester'] < 1) {
            Spawner.queueCreep({
                role:'harvester'
            })
            console.log('Queueing harvester');
        }
        if (roles['miner'] < 2) {
            Spawner.queueCreep({
                role:'miner',
                teamId: 1
            });
            console.log('Queueing miner');
        }
        if (roles['hauler'] < 2) {
            Spawner.queueCreep({
                role:'hauler',
                teamId: 1
            })
            console.log('Queueing hauler');
        }
        if (roles['builder'] < 2) {
            Spawner.queueCreep({
                role:'builder'
            })
            console.log('Queueing builder');
        }
        if (roles['upgrader'] < 2) {
            Spawner.queueCreep({
                role:'upgrader'
            })
            console.log('Queueing upgrader');
        }
    },
    getWhichCreepTierToSpawn: function(energyAvailable, role) {

    },
    spawnCreep: function(Spawner) {
        let parts = this.getWhichCreepToSpawn(Spawner);
    }
}
