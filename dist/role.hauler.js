module.exports = {

    run: function(creep) {
        if (creep.memory.emptying && creep.carry.energy == 0) {
            creep.memory.emptying = false;
        } else if (creep.carry.energy == creep.carryCapacity) {
            creep.memory.emptying = true;
        }

        if (!creep.memory.emptying) {
            // check crew
            if (!this.hasCrew(creep)) {
                this.assignCrew(creep);
                return;
            }

            if (creep.memory.target) {
                let pos = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName)
                let energy = pos.lookFor(LOOK_ENERGY)[0];
                if (energy) {
                    let pickup = creep.pickup(energy);
                    if (pickup == ERR_NOT_IN_RANGE) {
                        creep.moveTo(energy, {
                            visualizePathStyle: {
                                stroke: '#00FF00'
                            }
                        });
                    }
                } else {
                    creep.memory.target = false;
                    creep.log('Previous energy soure depleted')
                }
            } else {
                let list = creep.room.find(FIND_DROPPED_RESOURCES, {
                    filter: (d) => {
                        return d.resourceType == RESOURCE_ENERGY
                    }
                });
                list = list.sort((a, b) => {
                    return a.amount < b.amount
                });
                creep.memory.target = list[0].pos;
                creep.log('Moving to new resource location x:'+creep.memory.target.x + ', y:' + creep.memory.target.y +', room:' + creep.memory.target.roomName)
            }
        } else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                        structure.energy < structure.energyCapacity;
                }
            });
            var containers = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_CONTAINER && structure.store.energy < structure.storeCapacity
                }
            });
            if (targets.length > 0) {
                if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            } else if (containers.length > 0) {
                if (creep.transfer(containers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(containers[0], {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            } else {
                var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                if (targets.length) {
                    if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(targets[0], {
                            visualizePathStyle: {
                                stroke: '#ffffff'
                            }
                        });
                    }
                }
            }
        }
    },
    hasCrew: function(creep) {
        if (creep.memory.teamId != null && creep.memory.teamId != undefined) {
            if (Memory.miningCrews[creep.memory.teamId]) {
                return true;
            }
        }
        return false;
    },
    assignCrew: function(creep) {

    }
}
