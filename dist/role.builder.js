module.exports = {

    run: function(creep) {

        if (creep.memory.emptying && creep.store.getUsedCapacity() == 0) {
            creep.memory.emptying = false;
        } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
            creep.memory.emptying = true;
        }

        if (creep.memory.emptying) {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (object) => {
                    return (
                        object.hits < object.hitsMax
                        && (object.structureType !== STRUCTURE_WALL && object.structureType !== STRUCTURE_RAMPART)
                    );
                }
            });

            targets.sort((a, b) => a.hits - b.hits);
            if (targets.length > 0) {
                let repairCommand = creep.repair(targets[0]);
                if (repairCommand == ERR_NOT_IN_RANGE) {
                    creep.moveToPos(targets[0]);
                } else if (repairCommand != OK) {
                    console.log(repairCommand);
                }
            } else {
                let target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                if (target) {
                    if (creep.build(target) == ERR_NOT_IN_RANGE) {
                        creep.moveToPos(target);
                    }
                }
            }

        } else {
            creep.getEnergy(true, false);
        }
    }
};
