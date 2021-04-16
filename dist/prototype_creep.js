var roles = {
    'harvester': require('role.harvester'),
    'upgrader': require('role.upgrader'),
    'builder': require('role.builder'),
    'miner': require('role.miner'),
    'hauler': require('role.hauler'),
    'claimer': require('role.claimer'),
    'scout': require('role.scout'),
}
var roleEmoji = {
    'harvester':'⛏️',
    'upgrader':"🔬",
    'builder':'🛠️',
    'miner':'⚠️',
    'hauler':'🚚',
    'claimer': '🏴‍☠️',
    'scout': '🔭'
}

Creep.prototype.run = function() {
    new RoomVisual(this.room.name).text(roleEmoji[this.memory.role], this.pos.x + 0.8, this.pos.y+0.2, {
        color: 'white',
        font: 0.4
    });
    this.memory.manager_id = 0;
    if (!this.memory.respawn_complete) {
        let spawn = Game.spawns[this.memory.spawner]
        if (!spawn) {
            // this.memory.respawn_complete = true;
            this.log("Unable to complete respawn")
            return
        }
        spawn.room.memory.spawnQueue.splice(spawn.room.memory.spawnQueue.findIndex((element) => {
            return element.name === this.name;
        }), 1);
        this.memory.respawn_complete = true;
    }

    roles[this.memory.role].run(this);
};

Creep.prototype.log = function (content) {
    console.log("Creep:" + this.name + ': ' + String(content));
};

Creep.prototype.getManager = function () {
    return Memory.manager[0];
};

Creep.prototype.getEnergy = function(useContainer, useSource) {
    let container;
    if (useContainer) {
        var containers = this.room.find(FIND_STRUCTURES, {
            filter: (i) => {
                return ((i.structureType == STRUCTURE_CONTAINER || (i.structureType == STRUCTURE_SPAWN && i.store.energy > 250) )&& i.store.energy > 0)
            }
        });
        if (containers.length > 0) {
            // there is a container
            this.memory.sourceId = null;
            container = containers[0];
            if (this.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.moveTo(container, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
            }
        }
    }

    if (container === undefined && useSource) {
        if (!this.memory.sourceId) {
            var sources = this.room.find(FIND_SOURCES);
            let sourceId = null;
            let thisCount = 9999;
            for (var key in sources) {
                let response = _.filter(Game.creeps, (creep) => creep.memory.sourceId == sources[key].id).length;
                if (response < thisCount) {
                    sourceId = sources[key].id;
                    thisCount = response;
                }
            }
            this.memory.sourceId = sourceId;
        }
        if (this.memory.sourceId) {
            let sources = this.getManager().sources;
            for (let key in sources) {
                if (sources[key].sourceId !== this.memory.sourceId) {
                    continue;
                }
                if (this.memory.role != 'miner') {
                    break;
                }
                if (!sources[key].miners.includes(this.name)) {
                    this.getManager().sources[key].miners.push(this.name);
                }
            }

            let target = Game.getObjectById(this.memory.sourceId);
            if (this.harvest(target) == ERR_NOT_IN_RANGE) {
                this.moveTo(target, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
            }
        }
    }
}
