var roles = {
    'harvester': require('role.harvester'),
    'upgrader': require('role.upgrader'),
    'builder': require('role.builder'),
    'miner': require('role.miner'),
    'hauler': require('role.hauler'),
}
var roleEmoji = {
    'harvester':'⛏️',
    'upgrader':"🔬",
    'builder':'🛠️',
    'miner':'⚠️',
    'hauler':'🚚'
}

Creep.prototype.run = function() {
    new RoomVisual(this.room.name).text(roleEmoji[this.memory.role], this.pos.x + 0.8, this.pos.y+0.2, {
        color: 'white',
        font: 0.4
    });
    roles[this.memory.role].run(this);
};

Creep.prototype.log = function (content) {
    console.log("Creep:" + this.name + ': ' + String(content));
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
