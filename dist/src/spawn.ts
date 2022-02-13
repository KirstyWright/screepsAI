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
                    if (tempMiner.ticksToLive && tempMiner.ticksToLive > 80) {
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
                let result = Spawner.queueCreep({
                    role: 'miner',
                    sourceId: Spawner.manager.memory.sources[key].sourceId
                });
                Spawner.manager.memory.sources[key].miners.push(result.name);
            }
        }

        // get number of haulers needed from miners
        if (
            (roles['hauler'] < roles['miner'])
            || Spawner.manager.room.storage && Spawner.manager.taskManager.getTasksByType('collect') > (roles['hauler'] + 1)
        ) {
            Spawner.queueCreep({
                role: 'hauler'
            });
        }
        if (roles['builder'] < Math.max(1, (
            Spawner.manager.taskManager.getTasksByType('build').length
            + Spawner.manager.taskManager.getTasksByType('repair').length
        ) / 10)) {
        // if (roles['builder'] < Math.min(1, Spawner.room.find(FIND_CONSTRUCTION_SITES).length / 10)) {
            Spawner.queueCreep({
                role: 'builder'
            });
        }
        // If I have storage then use the proper calculations
        if (Spawner.room && Spawner.room.storage) {
            if (
                (roles['upgrader'] < Math.min(5, Math.max(1, Math.ceil(Spawner.room.storage.store[RESOURCE_ENERGY] / 20000) - 1)))
                && Spawner.manager.memory.spawnQueue.length < 5
            ) {
                Spawner.queueCreep({
                    role: 'upgrader'
                });
            }
        } else if (Spawner.room) {
            if (roles['upgrader'] < 2 && Spawner.room.energyAvailable > 250) {
                Spawner.queueCreep({
                    role: 'upgrader'
                });
            }
        }


        let numberOfExtensions = Spawner.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_EXTENSION;
            }
        }).length;
        if (numberOfExtensions > 0 && roles['distributor'] < Math.max(1, Math.floor(numberOfExtensions / 30)) && roles['hauler'] > 0) {
            Spawner.queueCreep({
                role: 'distributor'
            });
        }

        let reserveTasksCount = Spawner.manager.taskManager.getTasksByType('reserve').length;
        if (reserveTasksCount > 0) {
            if (roles['claimer'] < Math.max(1, reserveTasksCount)) {
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

    }
};
