export class SpawnModule {
  static run(spawn: StructureSpawn): void {
    this.queueNeededCreeps(spawn);
  }

  // TODO move this to Manager::scheduleCreepIfNotInQueue
  static queueNeededCreeps(Spawner: StructureSpawn): void {
    const roles: Record<string, number> = {
      harvester: 0,
      builder: 0,
      upgrader: 0,
      miner: 0,
      hauler: 0,
      distributor: 0,
      militia: 0,
      claimer: 0,
      scout: 0,
      cengineer: 0,
      cmedic: 0
    };
    const creepsInRoom = Spawner.manager.creeps;
    for (const key in creepsInRoom) {
      const creep = creepsInRoom[key];
      if ((creep.ticksToLive ?? 0) > 50 || creep.spawning) {
        roles[creep.memory.role] = roles[creep.memory.role] + 1;
      }
    }
    if (Spawner.manager.memory.spawnQueue) {
      for (const key in Spawner.manager.memory.spawnQueue) {
        const role = Spawner.manager.memory.spawnQueue[key].data.role;
        if (role) {
          roles[role] = roles[role] + 1;
        }
      }
    }

    if (
      roles.harvester < 2 &&
      roles.miner < 2 &&
      roles.hauler < 1 &&
      (!Spawner.manager.room.storage ||
        (Spawner.manager.room.storage && Spawner.manager.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 20000))
    ) {
      Spawner.queueCreep({
        role: "harvester"
      });
      return;
    }

    for (const key in Spawner.manager.memory.sources) {
      const miners = Spawner.manager.memory.sources[key].miners;
      let minerWillBeThereForAWhile = false;

      for (const x in miners) {
        if (Game.creeps[miners[x]]) {
          const tempMiner = Game.creeps[miners[x]];
          if (tempMiner.ticksToLive && tempMiner.ticksToLive > 80) {
            minerWillBeThereForAWhile = true;
            break;
          }
        }
        if (!Game.creeps[miners[x]] || Game.creeps[miners[x]].spawning) {
          // Must be in the spawn queue
          minerWillBeThereForAWhile = true;
          break;
        }
      }
      if (!minerWillBeThereForAWhile) {
        console.log("Need a new miner for " + Spawner.manager.memory.sources[key].sourceId);
        const result = Spawner.queueCreep({
          role: "miner",
          sourceId: Spawner.manager.memory.sources[key].sourceId
        });
        Spawner.manager.memory.sources[key].miners.push(result.name);
      }
    }

    const manager = Spawner.manager;
    const economyBudget = manager.getEconomyCreepBudget();
    const economyCount = manager.countEconomyCreeps(roles);
    const canSpawnEconomy = economyCount < economyBudget;
    const haulersNeeded = manager.getNumOfHaulersNeeded();
    const numOfBuildersNeeded = manager.getNumOfBuildersNeeded();
    const numOfUpgradersNeeded = manager.getNumOfUpgradersNeeded();

    if (canSpawnEconomy && roles.hauler < haulersNeeded) {
      const storage = manager.room.storage;
      const storageHasRoom =
        !storage || storage.store.getFreeCapacity(RESOURCE_ENERGY) > 1000;
      if (storageHasRoom && manager.hasSpawnEnergy(Spawner.room)) {
        Spawner.queueCreep({
          role: "hauler"
        });
      }
    }

    if (canSpawnEconomy && Spawner.room && manager.hasSpawnEnergy(Spawner.room)) {
      if (roles.upgrader < numOfUpgradersNeeded) {
        Spawner.queueCreep({
          role: "upgrader"
        });
      } else if (roles.builder < numOfBuildersNeeded) {
        Spawner.queueCreep({
          role: "builder"
        });
      }
    }

    const numberOfExtensions = Spawner.room.find(FIND_MY_STRUCTURES, {
      filter: structure => {
        return structure.structureType == STRUCTURE_EXTENSION;
      }
    }).length;
    if (
      canSpawnEconomy &&
      numberOfExtensions > 0 &&
      roles.distributor < Math.max(1, Math.floor(numberOfExtensions / 30)) &&
      roles.hauler > 0
    ) {
      Spawner.queueCreep({
        role: "distributor"
      });
    }

    const reserveTasksCount = Spawner.manager.taskManager.getTasksByType("reserve").length;
    if (reserveTasksCount > 0) {
      if (roles.claimer < Math.max(1, reserveTasksCount)) {
        Spawner.queueCreep({
          role: "claimer"
        });
      }
    }
    if (Spawner.manager.taskManager.getTasksByType("scout").length > 0) {
      if (roles.scout < 1) {
        Spawner.queueCreep({
          role: "scout"
        });
      }
    }
  }
}
