module.exports = {
    run: function(spawn) {
        if (spawn.room.memory.spawnQueue == undefined) {
            spawn.room.memory.spawnQueue = [];
        }
        this.queueNeededCreeps(spawn);
    },
    queueNeededCreeps: function(Spawner) {
        let roles = {
            harvester: 0,
            builder: 0,
            upgrader: 0,
            miner: 0,
            hauler: 0,
            milita: 0
        };
        let creepsInRoom = Spawner.manager.creeps;
        for (let key in creepsInRoom) {
            let creep = creepsInRoom[key];
            roles[creep.memory.role] = roles[creep.memory.role] + 1;
        }
        if (Spawner.manager.memory.spawnQueue) {
            for (let key in Spawner.manager.memory.spawnQueue) {
                let role = Spawner.manager.memory.spawnQueue[key].data.role;
                roles[role] = roles[role] + 1;
            }
        }

        // for (let key in roles) {
        //     console.log(key + ':' + roles[key]);
        // }
        if (roles['harvester'] < 1 && Spawner.manager.memory.sources.length > 0) {
            Spawner.queueCreep({
                role:'harvester'
            });
            console.log('Queueing harvester');
        }

        for (let key in Spawner.manager.memory.rooms) {
            let room = Game.rooms[Spawner.manager.memory.rooms[key]];
            if (room) {
                let enemies = room.find(FIND_HOSTILE_CREEPS);
                if (enemies.length > 0) {
                    if (roles['milita'] < 2) {
                        Spawner.queueCreep({
                            role:'milita',
                            category: 'patrol'
                        });
                        console.log('Queueing milita');
                    }
                }
            }
        }
        //
        // FIND_HOSTILE_CREEPS

        if (roles['miner'] < Spawner.manager.memory.sources.length) {
            Spawner.queueCreep({
                role:'miner'
            });
            console.log('Queueing miner');
        }
        if (roles['hauler'] < Math.ceil(roles['miner']) * 1.5) {
            Spawner.queueCreep({
                role:'hauler'
            });
            console.log('Queueing hauler');
        }
        if (roles['builder'] < 2 && Spawner.room.find(FIND_CONSTRUCTION_SITES).length > 0) {
            Spawner.queueCreep({
                role:'builder'
            });
            console.log('Queueing builder');
        }
        if (roles['upgrader'] < 4 && roles['harvester'] > 0) {
            Spawner.queueCreep({
                role:'upgrader'
            });
            console.log('Queueing upgrader');
        }

        // if (!Memory.temp || Memory.temp != 'a') {
        //     Memory.temp = 'a';
        //     Spawner.queueCreep({
        //         role:'milita',
        //         category:'raid',
        //         targetRoom: 'W43N28'
        //     });
        //     Spawner.queueCreep({
        //         role:'milita',
        //         category:'raid',
        //         targetRoom: 'W43N28'
        //     });
        //     Spawner.queueCreep({
        //         role:'milita',
        //         category:'raid',
        //         targetRoom: 'W43N28'
        //     });
        // }

    }
};
