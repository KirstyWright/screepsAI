var roles = {
    'harvester': {
        250: [MOVE, CARRY, CARRY, WORK]
        // 450: [MOVE, WORK, WORK, CARRY, CARRY, CARRY, CARRY],
        // 550: [MOVE, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY]
    },
    'builder': {
        250: [MOVE, CARRY, WORK, WORK]
    },
    'upgrader': {
        250: [MOVE, CARRY, WORK, WORK]
    },
    'miner': {
        250: [MOVE, WORK, WORK]
    },
    'hauler': {
        250: [MOVE, CARRY, CARRY, CARRY, CARRY]
    }
};

Spawn.prototype.queueCreep = function(data) {
    if (this.room.memory.spawnQueue == undefined) {
        this.room.memory.spawnQueue = [];
    }
    let parts = roles[data.role][250];
    this.room.memory.spawnQueue.push({
        parts:parts,
        data:data
    });
}
Spawn.prototype.attemptSpawning = function() {
    if (this.room.memory.spawnQueue.length > 0) {
        let creep = this.room.memory.spawnQueue.shift();
        let response = this.spawnCreep(creep.parts,this.generateCreepName(creep.data.role),{
            memory:creep.data
        });
        console.log(response);
        if (response < 0) {
            this.room.memory.spawnQueue.unshift(creep);
        }
    }
}
Spawn.prototype.generateCreepName = function(role) {
    if (Memory.lastCreepId == undefined) {
        Memory.lastCreepId = 0;
    }
    Memory.lastCreepId = Memory.lastCreepId + 1;
    return role + "-" + Memory.lastCreepId;
}
