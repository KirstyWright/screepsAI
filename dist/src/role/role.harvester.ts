export class RoleHarvester {
  static run(creep: Creep) {
    if (creep.memory.emptying && creep.store.getUsedCapacity() == 0) {
      creep.memory.emptying = false;
    } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
      creep.memory.emptying = true;
    }

    const miners = Object.values(creep.manager.creeps).filter((creep: Creep) => creep.memory.role == "miner");
    const haulers = Object.values(creep.manager.creeps).filter((creep: Creep) => creep.memory.role == "hauler");

    if (miners.length > 1 && haulers.length > 1) {
      creep.memory.role = "builder";
      creep.log("Converting a harvester to builder (" + creep.name + ")");
      return;
    }

    if (!creep.memory.emptying) {
      creep.getEnergy(false, true);
    } else {
      const targets = creep.room.find(FIND_STRUCTURES, {
        filter: structure => {
          return (
            (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
            structure.energy < structure.energyCapacity
          );
        }
      });
      const containers = creep.room.find(FIND_STRUCTURES, {
        filter: structure => {
          return (
            (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) &&
            structure.store.energy < structure.storeCapacity
          );
        }
      });
      if (targets.length > 0) {
        if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.travelTo(targets[0]);
        }
      } else if (containers.length > 0) {
        if (creep.transfer(containers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.travelTo(containers[0]);
        }
      } else {
        const targets: ConstructionSite[] = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (targets.length) {
          if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
            creep.travelTo(targets[0]);
          }
        }
      }
    }
  }
}
