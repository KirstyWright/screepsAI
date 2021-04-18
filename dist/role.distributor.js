module.exports = {

    run: function(creep) {
        if (creep.memory.emptying && creep.store.getUsedCapacity() == 0) {
            creep.memory.emptying = false;
        } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
            creep.memory.emptying = true;
        }

        if (!creep.memory.emptying) {
            creep.getEnergy(true, false);
        } else {
            let targetRoom = Game.rooms[creep.getManagerMemory().room];
            var targets = targetRoom.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                        structure.energy < structure.energyCapacity;
                }
            });
            if (targets.length > 0) {
                if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveToPos(targets[0], {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            } else {
                targets = targetRoom.find(FIND_CONSTRUCTION_SITES);
                if (targets.length) {
                    if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveToPos(targets[0], {
                            visualizePathStyle: {
                                stroke: '#ffffff'
                            }
                        });
                    }
                }
            }
        }
    }
};
