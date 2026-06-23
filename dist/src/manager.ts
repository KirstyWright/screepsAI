import { TaskManager } from "taskmanager";
import { GroupManager } from "groupmanager";
import { SpawnModule } from "spawn";
import { BuildModule } from "build";
import { GroupCombat } from "./group/combat";

export class Manager {
  memory: ManagerMemory;
  id: number;
  room: Room;
  creeps: Record<string, Creep> = {};
  spawners: StructureSpawn[];
  taskManager: TaskManager;
  groupManager: GroupManager;
  wallStrength: number = 1000;

  constructor(id: number) {
    this.id = id;
    this.memory = Memory.manager[id];
    this.creeps = {};
    this.room = Game.rooms[this.memory.room];

    const search = this.room.find(FIND_MY_SPAWNS);

    this.spawners = search;
    this.spawners.forEach(spawner => {
      spawner.manager = this;
    });
    this.taskManager = new TaskManager(this);
    this.groupManager = new GroupManager(this);
  }
  log(content: string | number | boolean) {
    console.log("Manager:" + this.id + ": " + String(content));
  }
  init() {
    if (!this.memory.creeps) {
      this.memory.creeps = [];
    }
    if (!this.memory.groups) {
      this.memory.groups = {};
    }

    if (!this.memory.spawnQueue) {
      this.memory.spawnQueue = [];
    }

    if (!this.memory.tasks) {
      this.memory.tasks = {};
    }

    if (!this.memory.variables) {
      this.memory.variables = {
        defenseLevel: 1,
        defenseLevelModifiedTick: Game.time
      };
    }

    if (!this.memory.rooms || this.memory.rooms.length == 0) {
      this.memory.rooms = [];
      const exits = Game.map.describeExits(this.room.name);
      this.memory.rooms = Object.values(exits || {});
      this.memory.rooms.push(this.memory.room);
    }

    if (!this.memory.sources || this.memory.sources.length == 0) {
      this.memory.sources = [];
      const sources = [];
      const sourcesInRoom = this.room.find(FIND_SOURCES);
      for (const key in sourcesInRoom) {
        sources.push({
          miners: [],
          pos: sourcesInRoom[key].pos,
          sourceId: sourcesInRoom[key].id,
          containerId: null
        });
        this.log("Found new source " + sourcesInRoom[key].id);
      }
      this.memory.sources = sources;
    }

    for (let i = this.memory.creeps.length - 1; i >= 0; i--) {
      const creepName = this.memory.creeps[i];
      if (!Game.creeps[creepName]) {
        this.memory.creeps.splice(i, 1);
      } else {
        this.creeps[creepName] = Game.creeps[creepName];
        this.creeps[creepName].moved = false;
      }
    }
    if (this.room.controller && this.room.controller.level > 2) {
      this.wallStrength = this.room.controller.level * 1000 * 2;
    }
  }
  addRoom(roomName: string) {
    const room = Game.rooms[roomName];
    if (room) {
      if (!this.memory.rooms.includes(roomName)) {
        this.memory.rooms.push(roomName);
      }

      const sourcesInRoom = room.find(FIND_SOURCES);
      for (const key in sourcesInRoom) {
        const currentSourcesWithThisId = this.memory.sources.filter((source: ManagerMemorySources) => {
          return source.sourceId === sourcesInRoom[key].id;
        }).length;
        if (currentSourcesWithThisId == 0) {
          this.memory.sources.push({
            miners: [],
            pos: sourcesInRoom[key].pos,
            sourceId: sourcesInRoom[key].id,
            containerId: null
          });
          this.log("Found new source " + sourcesInRoom[key].id);
        }
      }
    }
  }
  run() {
    this.taskManager.getNewTasks();

    SpawnModule.run(this.spawners[0]);
    this.spawners.forEach(spawner => {
      spawner.attemptSpawning();
    });

    BuildModule.run(this);
    const towers = this.room.find<StructureTower>(FIND_MY_STRUCTURES, {
      filter: {
        structureType: STRUCTURE_TOWER
      }
    });

    towers.forEach(tower => {
      let result = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if (result) {
        tower.attack(result);
        return;
      }
      result = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
        filter: object => {
          return object.hits < object.hitsMax;
        }
      });
      if (result) {
        tower.heal(result);
        return;
      }

      if (tower.store.getUsedCapacity(RESOURCE_ENERGY) < 500) {
        return;
      }
      const targets = this.room.find(FIND_STRUCTURES, {
        filter: object => {
          return (
            (object.hits < object.hitsMax &&
              object.structureType !== STRUCTURE_WALL &&
              object.structureType !== STRUCTURE_RAMPART) ||
            ((object.structureType === STRUCTURE_WALL || object.structureType === STRUCTURE_RAMPART) &&
              object.hits < this.wallStrength)
          );
        }
      });
      targets.sort((a, b) => a.hits - b.hits);
      if (targets.length > 0) {
        tower.repair(targets[0]);
      }
    });

    this.groupManager.run();
    this.manageDefenses();

    const builders = Object.values(this.creeps).filter(creep => creep.memory.role == "builder");
    const upgraders = Object.values(this.creeps).filter(creep => creep.memory.role == "upgrader");
    const numOfBuildersNeeded = this.getNumOfBuildersNeeded();
    const numOfUpgradersNeeded = this.getNumOfUpgradersNeeded();

    if (numOfBuildersNeeded > builders.length && upgraders.length > numOfUpgradersNeeded) {
      const spareUpgrader = upgraders[0];
      if (spareUpgrader) {
        this.log("Converting an upgrader to builder (" + spareUpgrader.name + ")");
        spareUpgrader.memory.taskHash = null;
        spareUpgrader.memory.targetId = null;
        spareUpgrader.memory.role = "builder";
      }
    }
    if (this.room.controller && this.room.controller.ticksToDowngrade < 200) {
      // PANIC
      console.log("Controller near downgrade!!!");
    }
  }

  findStructuresByTypeInRooms<T extends StructureConstant>(
    structureType: T,
    filter?: (s: ConcreteStructure<T>) => boolean
  ): ConcreteStructure<T>[] {
    let results: ConcreteStructure<T>[] = [];
    for (const key in this.memory.rooms) {
      const room = Game.rooms[this.memory.rooms[key]];
      if (room) {
        results = results.concat(
          room.find(FIND_STRUCTURES).filter((s): s is ConcreteStructure<T> => s.structureType === structureType)
        );
      }
    }
    return filter ? results.filter(filter) : results;
  }

  findInRooms<K extends FindConstant, S extends FindTypes[K] = FindTypes[K]>(
    type: K,
    opts?: FilterOptions<FindTypes[K], S>
  ): FindTypes[K][] {
    let results: FindTypes[K][] = [];
    for (const key in this.memory.rooms) {
      const room = Game.rooms[this.memory.rooms[key]];
      if (room) {
        results = results.concat(room.find(type, opts));
      }
    }
    return results;
  }
  finish() {
    this.taskManager.finish();
    this.groupManager.finish();
  }

  scheduleCreepIfNotInQueue(role: string, data: CreepSpawnData, dry: boolean = false): boolean {
    const queue = this.memory.spawnQueue;
    let inQueue = false;
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.role == role) {
        for (const key in item.data) {
          if (data[key] && data[key] == item.data[key]) {
            inQueue = true;
            break;
          }
        }
      }
    }
    if (!inQueue && dry == false) {
      const spawner = this.spawners[0];
      data.role = role;
      spawner.queueCreep(data);
    }
    return inQueue;
  }

  /**
   * [manageDefenses description]
   * level1
   * - Normal ops
   * level2
   * - Triggered by a hostile creep (includes invaders)
   * - Drops to level1 when no hostile creeps
   * - Defender creep to room in question
   * level3
   * - Triggered by hostile creeps (includes invaders) in room for longer than 50 ticks or more than 2 creeps
   * - Drops to level 2 when all killed
   * - Defender creep group to room in question
   */
  manageDefenses(): void {
    const hostileCreepsInRooms: Creep[] = this.findInRooms(FIND_HOSTILE_CREEPS);
    const militiaCreeps = Object.values(this.creeps).filter(creep => {
      return creep.memory.role == "militia";
    });

    switch (this.memory.variables.defenseLevel) {
      case 1:
        // Do we need to go up?
        if (hostileCreepsInRooms.length > 0) {
          this.changeDefenseLevel(2);
        }
        break;
      case 2:
        if (hostileCreepsInRooms.length == 0) {
          this.changeDefenseLevel(1);
        } else if (
          hostileCreepsInRooms.length > 4 ||
          Game.time > (this.memory.variables.defenseLevelModifiedTick ?? Game.time) + 50
        ) {
          this.changeDefenseLevel(3);
        }
        break;
      case 3:
        if (militiaCreeps.length < 2) {
          this.scheduleCreepIfNotInQueue("militia", { category: "patrol" });
        }

        if (hostileCreepsInRooms.length == 0) {
          this.changeDefenseLevel(2);
          // Group gets autodeleted by constructor
        }
        if (Game.time > (this.memory.variables.defenseLevelModifiedTick ?? Game.time) + 500) {
          // this.changeDefenseLevel(4);
        }
        break;
      case 4:
        const cgroup = new GroupCombat("RECRUITING", this.room.name, false);

        if (!this.groupManager.groups[cgroup.hash]) {
          this.groupManager.addGroup(cgroup);
        }

        if (hostileCreepsInRooms.length == 0) {
          this.changeDefenseLevel(2);
          // Group gets autodeleted by constructor
        }
        break;
      default:
        this.changeDefenseLevel(1);
    }
  }

  changeDefenseLevel(level: number): void {
    this.log("Defense level changing from " + this.memory.variables.defenseLevel + " to " + level);
    this.memory.variables.defenseLevel = level;
    this.memory.variables.defenseLevelModifiedTick = Game.time;
  }

  getNumOfBuildersNeeded(): number {
    const builderWorkTasks = [
      ...this.taskManager.getTasksByType("build"),
      ...this.taskManager.getTasksByType("repair"),
    ];
    const workRemaining = builderWorkTasks.reduce((sum, task) => sum + task.getWorkRemaining(), 0);
    if (workRemaining === 0) {
      return 0;
    }

    const WORK_PER_BUILDER = 2500;
    return Math.min(this.getMaxBuilders(), Math.ceil(workRemaining / WORK_PER_BUILDER));
  }

  getMaxBuilders(): number {
    const rcl = this.room.controller?.level ?? 1;
    return Math.min(3, 1 + Math.floor(rcl / 3));
  }

  getNumOfUpgradersNeeded(): number {
    const rcl = this.room.controller?.level ?? 1;
    if (rcl >= 6) {
      return 2;
    }
    return 1;
  }

  getNumOfHaulersNeeded(): number {
    const minerCount = this.memory.sources.length;
    if (minerCount <= 1) {
      return 1;
    }

    let containerBacklog = 0;
    for (const source of this.memory.sources) {
      if (!source.containerId) {
        continue;
      }
      const container = Game.getObjectById(source.containerId);
      if (container) {
        containerBacklog += container.store.getUsedCapacity(RESOURCE_ENERGY);
      }
    }

    // One hauler can cycle two mining containers; add a second only when backlog is high.
    if (containerBacklog > 1500) {
      return Math.min(2, minerCount);
    }
    return 1;
  }

  getEconomyCreepBudget(): number {
    const rcl = this.room.controller?.level ?? 1;
    const sourceCount = this.memory.sources.length;
    let budget = sourceCount + 1 + this.getNumOfUpgradersNeeded() + Math.min(2, Math.floor(rcl / 2));
    const extensions = this.room.find(FIND_MY_STRUCTURES, {
      filter: { structureType: STRUCTURE_EXTENSION }
    }).length;
    if (extensions > 0) {
      budget += 1;
    }
    return budget;
  }

  countEconomyCreeps(roles: Record<string, number>): number {
    return (
      roles.harvester +
      roles.miner +
      roles.hauler +
      roles.builder +
      roles.upgrader +
      roles.distributor
    );
  }

  hasSpawnEnergy(room: Room, minimum = 250): boolean {
    return room.energyAvailable >= minimum;
  }
}
