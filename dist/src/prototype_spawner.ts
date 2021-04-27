export { }
const spawnRoles: Record< string, BodyPartConstant[]> = {
    'harvester': [MOVE, CARRY, WORK],
    'builder': [MOVE, CARRY, CARRY, WORK],
    'upgrader': [MOVE, CARRY, CARRY, WORK],
    'miner': [MOVE, WORK, WORK],
    'hauler': [MOVE, CARRY, CARRY],
    'claimer': [MOVE, CLAIM],
    'milita': [TOUGH, RANGED_ATTACK, MOVE, MOVE],
    'distributor': [MOVE, CARRY, CARRY]
};

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
    if (this.manager.memory.spawnQueue && this.manager.memory.spawnQueue.length > 0) {
        for (let key in this.manager.memory.spawnQueue) {
            let creep = this.manager.memory.spawnQueue[key];
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

                let maxEnergy = 300 + (50 * this.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_EXTENSION;
                    }
                }).length);

                while (true) {
                    loop = loop + 1;
                    let cost = costPerMinimumParts * loop;
                    // if (cost >= this.room.energyAvailable) {
                    if (maxEnergy <= cost) {
                        break;
                    }
                    //  else if (!this.room.storage && cost >= this.room.energyAvailable) {
                    //     break // if I have more than the cost
                    // }
                }
                let body: BodyPartConstant[] = [];
                for (var x = 1; x < loop; x++) {
                    body = body.concat(spawnRoles[creep.role]);
                }
                response = this.spawnCreep(body, name, {
                    memory: creep.data
                });

                // for (let key in sortable) {
                //     let row = sortable[key];
                //     if (row.cost <= this.room.energyAvailable) {
                //         response = this.spawnCreep(spawnRoles[creep.role][sortable[key].cost], name, {
                //             memory: creep.data
                //         });
                //         break;
                //     }
                //
                //     if (this.room.storage && this.room.storage.store[RESOURCE_ENERGY] >= row.cost) {
                //         break;
                //     }
                // }
            } else {
                response = this.spawnCreep(creep.parts, name, {
                    memory: creep.data
                });
            }
            if (response == 0) {
                creep.spawned = true;
                creep.name = name;
                creep.spawner = this.name;
                this.manager.memory.spawnQueue[0] = creep;
            }
            break;
        }
    }
};
Spawn.prototype.generateCreepName = function(role) {
    if (Memory.lastCreepId == undefined) {
        Memory.lastCreepId = 0;
    }
    Memory.lastCreepId = Memory.lastCreepId + 1;
    return role + "-" + this.manager.id + ":" + Memory.lastCreepId;
};
