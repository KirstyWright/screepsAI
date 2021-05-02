export class RoleDistributor {
    static run(creep: Creep) {
        if (creep.memory.emptying && creep.store.getUsedCapacity() == 0) {
            creep.memory.emptying = false;
        } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
            creep.memory.emptying = true;
        }

        if (!creep.memory.emptying) {
            creep.getEnergy(true, false);
        } else {
            let targetRoom = creep.manager.room;
            if (creep.room.name != targetRoom.name) {
                creep.moveToPos(new RoomPosition(25, 25, targetRoom.name));
                return;
            }
            var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure: StructureExtension | StructureSpawn) => {
                    return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                        structure.energy < structure.energyCapacity;
                }
            });
            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveToPos(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            } else {
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure: StructureTower) => {
                        return (structure.structureType == STRUCTURE_TOWER) &&
                            structure.energy < structure.energyCapacity;
                    }
                });
                if (target) {
                    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveToPos(target, {
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
