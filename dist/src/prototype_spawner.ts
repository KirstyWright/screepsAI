export { }
const spawnRoles: Record< string, BodyPartConstant[]> = {
    'harvester': [MOVE, CARRY, WORK],
    'builder': [MOVE, CARRY, CARRY, WORK],
    'upgrader': [MOVE, CARRY, CARRY, WORK],
    'miner': [MOVE, WORK, WORK],
    'hauler': [MOVE, CARRY, CARRY],
    'claimer': [MOVE, CLAIM],
    'milita': [TOUGH, RANGED_ATTACK, MOVE, MOVE],
    'distributor': [MOVE, CARRY, CARRY],
    'scout': [MOVE, WORK]
};

const spawnPriority = [
    'harvester', 'distributor', 'milita', 'miner', 'hauler', 'builder', 'upgrader', 'claimer', 'scout'
];

Spawn.prototype.queueCreep = function(data) {
    if (this.manager.memory.spawnQueue == undefined) {
        this.manager.memory.spawnQueue = [];
    }
    data.managerId = this.manager.id;

    let spawnObject = {
        parts: spawnRoles[data.role][250],
        role: data.role,
        name: this.generateCreepName(data.role),
        data: data
    };
    this.manager.memory.spawnQueue.push(spawnObject);
    return spawnObject;
};
Spawn.prototype.attemptSpawning = function() {
    if (this.spawning) {
        return;
    }

    if (!this.manager.memory.spawnQueue) {
        return;
    }

    let queue = this.manager.memory.spawnQueue.sort( (a: any, b: any) => {
        return spawnPriority.indexOf(a.role) - spawnPriority.indexOf(b.role);
    } )

    // // Emergency harvester
    // if (
    //     Object.values(Game.creeps).filter((creep) => creep.memory.managerId == this.manager.id && (
    //         creep.memory.role == 'miner' || creep.memory.role == 'hauler' || creep.memory.role == 'harvester'
    //     )).length == 0
    // ) {
    //     console.log('Need emergency harvester');
    //     this.spawnCreep([WORK, MOVE, CARRY], this.generateCreepName('harvester'), {
    //         memory: {
    //             role: 'harvester',
    //             managerId: this.manager.id
    //         }
    //     });
    // }

    for (let key in queue) {
        let creep = queue[key];
        if (creep.spawned) {
            continue;
        }
        let response = -20;
        let name = creep.name;
        creep.data.spawner = this.name;
        if (creep.role && spawnRoles[creep.role]) {

            let costPerMinimumParts = 0;

            for (var i = 0; i < spawnRoles[creep.role].length; i++) {
                costPerMinimumParts = costPerMinimumParts + BODYPART_COST[spawnRoles[creep.role][i]];
            }
            let loop = 1;

            let numberOfDistributors = Object.values(Game.creeps).filter((creep) => creep.memory.managerId == this.manager.id && creep.memory.role == 'distributor').length;
            // console.log(numberOfDistributors);
            while (true) {
                loop = loop + 1;
                let cost = costPerMinimumParts * loop;
                // if (cost >= this.room.energyAvailable) {
                if (loop > 3 && creep.role == 'miner') {
                    break; // 5w parts will exhaust a resource
                }
                if (loop > 1 && creep.role == 'scout') {
                    break;
                }
                if (this.room.energyAvailable <= cost) {
                    if (this.room.storage) {
                        // if we have storage in the room
                        if (this.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) <= cost) {
                            // If storage exists and has less energy than is needed to spawn the creep
                            break;
                        } else if  (numberOfDistributors < 1) {
                            // if Storage exists and there are no distributors
                            break;
                        }
                    } else {
                        break;
                    }
                }
                if (this.room.energyCapacityAvailable <= cost) {
                    // If cost >= the energy the spawner & extensions can provide
                    break;
                }
            }
            let body: BodyPartConstant[] = [];
            for (var x = 1; x < loop; x++) {
                body = body.concat(spawnRoles[creep.role]);
            }
            response = this.spawnCreep(body, name, {
                memory: creep.data
            });

        } else {
            response = this.spawnCreep(creep.parts, name, {
                memory: creep.data
            });
        }
        if (response == 0) {
            creep.spawned = true;
            creep.name = name;
            creep.spawner = this.name;
            queue[key] = creep;
        }
        break;
    }
    this.manager.memory.spawnQueue = queue; // might as well overwrite in order
};
Spawn.prototype.generateCreepName = function(role) {
    if (Memory.lastCreepId == undefined) {
        Memory.lastCreepId = 0;
    }
    Memory.lastCreepId = Memory.lastCreepId + 1;
    return role + "-" + this.manager.id + ":" + Memory.lastCreepId;
};
