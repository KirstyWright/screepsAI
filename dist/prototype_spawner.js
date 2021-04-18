var roles = {
    'harvester': {
        550: [MOVE, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY],
        250: [MOVE, CARRY, CARRY, WORK],
        200: [MOVE, CARRY, WORK]
        // 450: [MOVE, WORK, WORK, CARRY, CARRY, CARRY, CARRY],
    },
    'builder': {
        700: [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK],
        600: [MOVE, MOVE, CARRY, CARRY, WORK, WORK, WORK, WORK],
        250: [MOVE, CARRY, WORK, WORK]
    },
    'upgrader': {
        700: [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK],
        600: [MOVE, MOVE, CARRY, CARRY, WORK, WORK, WORK, WORK],
        250: [MOVE, CARRY, WORK, WORK]
    },
    'miner': {
        650: [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK],
        250: [MOVE, WORK, WORK]
    },
    'hauler': {
        700: [MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
        450: [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY],
        250: [MOVE, CARRY, CARRY, CARRY, CARRY],
        150: [MOVE, CARRY, CARRY],
    },
    'claimer': {
        1300: [MOVE,MOVE,CLAIM,CLAIM],
        650: [MOVE,CLAIM]
    },
    'milita': {
        170: [TOUGH,MOVE,MOVE,RANGED_ATTACK],
        460: [TOUGH,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK],
        660: [TOUGH,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK],
        860: [TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK]
    },
    'distributor': {
        250: [MOVE, CARRY, CARRY, CARRY, CARRY],
        150: [MOVE, CARRY, CARRY]
    }
};

Spawn.prototype.queueCreep = function(data) {
    if (this.manager.memory.spawnQueue == undefined) {
        this.manager.memory.spawnQueue = [];
    }
    data.managerId = this.manager.id;

    let spawnObject = {
        parts: roles[data.role][250],
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
            if (creep.role && roles[creep.role]) {

                let sortable = [];
                for (let cost in roles[creep.role]) {
                    sortable.push({
                        "cost": cost,
                        "creep": roles[creep.role][cost]
                    });
                }

                sortable.sort(function(a, b) {
                    return a["cost"] < b["cost"];
                });
                for (let key in sortable) {
                    if (sortable[key].cost <= this.room.energyAvailable) {
                        response = this.spawnCreep(roles[creep.role][sortable[key].cost], name, {
                            memory: creep.data
                        });
                        break;
                    }
                }
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
