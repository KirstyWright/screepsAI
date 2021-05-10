export class SpawnModule {

    static run(spawn: StructureSpawn): void {
        this.queueNeededCreeps(spawn);
    }

    static queueNeededCreeps(Spawner: StructureSpawn): void {
        let roles: Record<string, number> = {
            harvester: 0,
            builder: 0,
            upgrader: 0,
            miner: 0,
            hauler: 0,
            distributor: 0,
            milita: 0,
            claimer: 0,
            scout: 0
        };
        let creepsInRoom = Spawner.manager.creeps;
        for (let key in creepsInRoom) {
            let creep = creepsInRoom[key];
            if (creep.ticksToLive > 50 || creep.spawning) {
                roles[creep.memory.role] = roles[creep.memory.role] + 1;
            }
        }
        if (Spawner.manager.memory.spawnQueue) {
            for (let key in Spawner.manager.memory.spawnQueue) {
                let role = Spawner.manager.memory.spawnQueue[key].data.role;
                roles[role] = roles[role] + 1;
            }
        }

        // DEFENSIVE CODE
        let enemies = 0;
        for (let key in Spawner.manager.memory.rooms) {
            let room = Game.rooms[Spawner.manager.memory.rooms[key]];
            if (room) {
                enemies = enemies + Spawner.manager.findInRooms(FIND_HOSTILE_CREEPS).length;
            }
        }
        if (enemies > 0) {
            if (roles['milita'] < 2) {
                Spawner.queueCreep({
                    role: 'milita',
                    category: 'patrol'
                });
            }
        }

        if (roles['harvester'] < 2 && roles['miner'] < 2 && roles['hauler'] < 1) {
            Spawner.queueCreep({
                role: 'harvester'
            });
            return;
        }

        for (let key in Spawner.manager.memory.sources) {
            let miners = Spawner.manager.memory.sources[key].miners;
            let minerWillBeThereForAWhile = false;

            for (let x in miners) {
                if (Game.creeps[miners[x]]) {
                    let tempMiner = Game.creeps[miners[x]];
                    if (tempMiner.ticksToLive && tempMiner.ticksToLive > 150) {
                        minerWillBeThereForAWhile = true;
                        break;
                    }
                }
                if (!Game.creeps[miners[x]] || Game.creeps[miners[x]].spawning) {
                    // Must be in the spawn queue
                    minerWillBeThereForAWhile = true;
                    break;
                }
            }
            if (!minerWillBeThereForAWhile) {
                console.log("Need a new miner for " + Spawner.manager.memory.sources[key].sourceId);
                let result = Spawner.queueCreep({
                    role: 'miner',
                    sourceId: Spawner.manager.memory.sources[key].sourceId
                });
                Spawner.manager.memory.sources[key].miners.push(result.name);
            }
        }

        if (roles['hauler'] < (roles['miner'] + 2 )) {
            Spawner.queueCreep({
                role: 'hauler'
            });
        }
        if (roles['builder'] < Math.max(1, (
            Spawner.manager.taskManager.getTasksByType('build').length
            + Spawner.manager.taskManager.getTasksByType('repair').length
        ) / 30)) {
        // if (roles['builder'] < Math.min(1, Spawner.room.find(FIND_CONSTRUCTION_SITES).length / 10)) {
            Spawner.queueCreep({
                role: 'builder'
            });
        }
        if (Spawner.room && Spawner.room.storage) {
            if (roles['upgrader'] < Math.min(Math.max(1, Math.ceil((Spawner.room.storage.store[RESOURCE_ENERGY]) / 10000)), 4)) {
                Spawner.queueCreep({
                    role: 'upgrader'
                });
            }
        }
        if (roles['distributor'] < Math.floor(Spawner.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_EXTENSION;
            }
        }).length / 15) && roles['hauler'] > 0) {
            Spawner.queueCreep({
                role: 'distributor'
            });
        }

        let reserveTasksCount = Spawner.manager.taskManager.getTasksByType('reserve').length;
        if (reserveTasksCount > 0) {
            if (roles['claimer'] < reserveTasksCount) {
                Spawner.queueCreep({
                    role: 'claimer'
                });
            }
        }
        if (Spawner.manager.taskManager.getTasksByType('scout').length > 0) {
            if (roles['scout'] < 1) {
                Spawner.queueCreep({
                    role: 'scout'
                });
            }
        }
        // //

        // if (!Memory.temp || Memory.temp != 'b') {
        //     Memory.temp = 'b';
        //     // Spawner.queueCreep({
        //     //     role:'milita',
        //     //     category:'raid',
        //     //     targetRoom: 'W43N29'
        //     // });
        // }

    }
};
