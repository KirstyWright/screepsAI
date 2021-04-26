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
            distributor: 0,
            milita: 0,
            claimer: 0
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

        // DEFENSIVE CODE

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
                    }
                }
            }
        }

        if (roles['harvester'] < 2 && roles['miner'] < 1 && roles['hauler'] < 1) {
            Spawner.queueCreep({
                role:'harvester'
            });
            return;
        }

        for (let key in Spawner.manager.memory.sources) {
            let miners = Spawner.manager.memory.sources[key].miners;
            let minerWillBeThereForAWhile = false;

            for (let x in miners) {
                if (Game.creeps[miners[x]] && Game.creeps[miners[x]].ticksToLive > 150) {
                    minerWillBeThereForAWhile = true;
                    break;
                } else if (!Game.creeps[miners[x]] || Game.creeps[miners[x]].spawning) {
                    // Must be in the spawn queue
                    minerWillBeThereForAWhile = true;
                    break;
                }
            }
            if (!minerWillBeThereForAWhile) {
                console.log("Need a new miner for "+Spawner.manager.memory.sources[key].sourceId);
                let result = Spawner.queueCreep({
                    role: 'miner',
                    sourceId: Spawner.manager.memory.sources[key].sourceId
                });
                Spawner.manager.memory.sources[key].miners.push(result.name);
            }
        }

        if (roles['hauler'] < (roles['miner'] *2)) {
            Spawner.queueCreep({
                role:'hauler'
            });
        }
        if (roles['builder'] < Math.max(2, Spawner.room.find(FIND_CONSTRUCTION_SITES).length / 10)) {
            Spawner.queueCreep({
                role:'builder'
            });
        }
        // if (roles['upgrader'] < Math.max(1, Math.ceil((Spawner.room.storage.store[RESOURCE_ENERGY] - 2000 ) / 1000))) {
        if (roles['upgrader'] < 1) {
            Spawner.queueCreep({
                role:'upgrader'
            });
        }
        if (roles['distributor'] < Math.ceil(Math.max(Spawner.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_EXTENSION;
            }}).length / 10)) && roles['hauler'] > 0) {
            Spawner.queueCreep({
                role:'distributor'
            });
        }


        if (Spawner.manager.memory.spawnQueue.length < 2) {
            if (Game.flags['claim'] && roles['claimer'] < 1) {
                Spawner.queueCreep({
                    role:'claimer'
                });
            }
        }
        // //
        // if (!Memory.temp || Memory.temp != 'e') {
        //     Memory.temp = 'e';
        //     for (var i = 0; i < 10; i++) {
        //         Spawner.queueCreep({
        //             role:'builder'
        //         });
        //     }
        // }
        // if (!Memory.temp || Memory.temp != 'b') {
        //     Memory.temp = 'b';
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
        //     Spawner.queueCreep({
        //         role:'milita',
        //         category:'raid',
        //         targetRoom: 'W43N28'
        //     });
        // }

    }
};
