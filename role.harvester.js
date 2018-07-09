module.exports = {

    run: function(creep)
    {
        if(creep.memory.emptying && creep.carry.energy == 0) {
            creep.memory.emptying = false;
        }
        if(!creep.memory.emptying && creep.carry.energy == creep.carryCapacity) {
            creep.memory.emptying = true;
        }

        if(!creep.memory.emptying) {
            creep.getEnergy(false,true);
        }
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (
                            structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_TOWER ||
                            structure.structureType == STRUCTURE_CONTAINER
                        ) && structure.energy < structure.energyCapacity;
                    }
            });
            if (targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#FF0000'}});
                }
            } else {
                var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                if(targets.length) {
                    if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
        }
    }
}
