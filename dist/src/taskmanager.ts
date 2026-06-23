import { Manager } from "manager";

function taskHasTargetPos(task: Task): task is Task & { target: TaskTargetWithPos } {
  const target = (task as { target?: unknown }).target;
  if (typeof target !== "object" || target === null || !("pos" in target)) {
    return false;
  }
  const pos = (target as TaskTargetWithPos).pos;
  return typeof pos.x === "number" && typeof pos.y === "number" && typeof pos.roomName === "string";
}
import { BuildTask } from "task.build";
import { RepairTask } from "task.repair";
import { CollectTask } from "task.collect";
import { SupplyTask } from "task.supply";
import { ReserveTask } from "task.reserve";
import { Task } from "task";
import { ScoutTask } from "task.scout";

type TaskTypeMap = {
  build: BuildTask;
  repair: RepairTask;
  collect: CollectTask;
  supply: SupplyTask;
  reserve: ReserveTask;
  scout: ScoutTask;
};


export class TaskManager {
  manager: Manager;
  tasks: Record<string, BuildTask | RepairTask | CollectTask | SupplyTask | ReserveTask | ScoutTask | Task>;
  constructor(manager: Manager) {
    this.manager = manager;
    this.tasks = {};
    this.loadFromMemory();
  }
  finish() {
    this.saveToMemory();
  }
  getTasksByType<T extends keyof TaskTypeMap>(type: T): TaskTypeMap[T][] {
    return Object.values(this.tasks).filter(
      (task): task is TaskTypeMap[T] => task.type === type
    );
  }
  getNewTasks() {
    // Build tasks
    const targets = this.manager.findInRooms(FIND_MY_CONSTRUCTION_SITES);
    for (const key in targets) {
      const task = new BuildTask(targets[key]);
      this.addTaskToQueue(task);
    }

    // Repair tasks
    const secondTargets = this.manager.findInRooms(FIND_STRUCTURES, {
      filter: object => {
        if (!("hits" in object) || !("hitsMax" in object) || !("structureType" in object)) {
          return false;
        }
        const hits = object.hitsMax * (1 - 0.1);
        return (
          (object.hits < hits &&
            object.structureType !== STRUCTURE_WALL &&
            object.structureType !== STRUCTURE_RAMPART) ||
          ((object.structureType === STRUCTURE_WALL || object.structureType === STRUCTURE_RAMPART) &&
            object.hits < this.manager.wallStrength)
        );
      }
    });

    for (const key in secondTargets) {
      const task = new RepairTask(secondTargets[key]);
      this.addTaskToQueue(task);
    }

    // Collect tasks
    let list: (Resource | Ruin | Tombstone)[] = [];
    list = this.manager.findInRooms(FIND_DROPPED_RESOURCES, {
      filter: d => {
        return d.resourceType == RESOURCE_ENERGY && d.amount > 300;
      }
    });

    list = list.concat(this.manager.findInRooms(FIND_RUINS));
    list = list.concat(this.manager.findInRooms(FIND_TOMBSTONES));

    // Get collection source
    const miningContainers: Id<StructureContainer>[] = [];
    this.manager.memory.sources.forEach((element: ManagerMemorySources) => {
      if (!element.containerId) {
        return;
      }
      miningContainers.push(element.containerId);
    });

    // Get collection destination
    let destination: StructureContainer | StructureStorage | StructureExtension | StructureSpawn | null = null;
    if (this.manager.room.storage) {
      destination = this.manager.room.storage;
    } else {
      const list = this.manager.room.find(FIND_MY_STRUCTURES, {
        filter: (structure: AnyOwnedStructure) => {
          return (
            (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          );
        }
      });

      if (list.length == 0) {
        const newlist = this.manager.room.find(FIND_STRUCTURES, {
          filter: (structure: AnyStructure) => {
            if (structure.structureType != STRUCTURE_CONTAINER) {
              return false;
            }
            return (
              !miningContainers.includes(structure.id) &&
              structure.structureType == STRUCTURE_CONTAINER &&
              structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            );
          }
        });
        destination = newlist[0] as StructureContainer;
      }

      if (!destination) {
        destination = list[0] as StructureExtension | StructureContainer | StructureSpawn;
      }
    }
    if (!destination) {
      this.createSupplyTasks(miningContainers);
      return;
    }

    for (let i = 0; i < miningContainers.length; i++) {
      const container = Game.getObjectById(miningContainers[i]);
      if (container && container.store.getUsedCapacity(RESOURCE_ENERGY) > 100 && destination) {
        const task = new CollectTask(container, destination, container.store.getUsedCapacity(RESOURCE_ENERGY));
        if (!this.addTaskToQueue(task)) {
          (this.tasks[task.hash] as CollectTask).amount = container.store.getUsedCapacity(RESOURCE_ENERGY);
        }
      }
    }

    // Fill containers
    if (this.manager.room.storage) {
      const roomStorage = this.manager.room.storage;
      const containerList = this.manager.room.find(FIND_STRUCTURES, {
        filter: (structure: AnyStructure): structure is StructureContainer => {
          if (structure.structureType != STRUCTURE_CONTAINER) {
            return false;
          }
          return (
            !miningContainers.includes(structure.id) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          );
        }
      });

      for (let i = 0; i < containerList.length; i++) {
        const container = containerList[i];
        const freeCapacity = container.store.getFreeCapacity(RESOURCE_ENERGY);
        const task = new CollectTask(roomStorage, container, freeCapacity);
        if (!this.addTaskToQueue(task)) {
          (this.tasks[task.hash] as CollectTask).amount = freeCapacity;
        }
      }
    }

    for (const key in list) {
      const item = list[key];
      let amount = 0;

      if ("amount" in item) {
        amount = item.amount;
      } else if ("store" in item) {
        amount = item.store.getUsedCapacity(RESOURCE_ENERGY);
      }

      const task = new CollectTask(list[key], destination, amount);
      if (!this.addTaskToQueue(task)) {
        if (
          (this.tasks[task.hash] as CollectTask).amount !== amount &&
          Math.abs((this.tasks[task.hash] as CollectTask).amount - amount)
        ) {
          (this.tasks[task.hash] as CollectTask).amount = amount;
        }
      }
    }
  }
  addTaskToQueue(task: Task): boolean {
    if (!this.tasks[task.hash]) {
      this.tasks[task.hash] = task;
      task.manager = this.manager;
      return true;
    }
    return false;
  }
  loadFromMemory() {
    this.tasks = {};
    for (const hash in this.manager.memory.tasks) {
      const memoryTask = this.manager.memory.tasks[hash];
      var task: Task | false;
      switch (memoryTask.type) {
        case "build":
          task = BuildTask.buildFromMemory(memoryTask);
          break;
        case "repair":
          task = RepairTask.buildFromMemory(memoryTask);
          break;
        case "collect":
          task = CollectTask.buildFromMemory(memoryTask);
          break;
        case "supply":
          task = SupplyTask.buildFromMemory(memoryTask);
          break;
        case "reserve":
          task = ReserveTask.buildFromMemory(memoryTask);
          break;
        case "scout":
          task = ScoutTask.buildFromMemory(memoryTask);
          break;
        default:
          console.log("Invalid task " + hash);
          continue;
      }
      if (task) {
        this.addTaskToQueue(task);
      }
    }
  }
  saveToMemory() {
    const list: Record<string, ManagerMemoryTask> = {};
    for (const hash in this.tasks) {
      const task = this.tasks[hash];
      list[task.hash] = task.storageData();
    }
    this.manager.memory.tasks = list;
  }
  getNewTask(creep: Creep): null | Task {
    const tempTasks: Record<number, Task> = {};
    let count = 0;
    Object.values(this.tasks).forEach(task => {
      if (taskHasTargetPos(task) && task.target.pos.roomName == creep.room.name) {
        const pos = task.target.pos;
        const difference = Math.abs(pos.x - creep.pos.x + (pos.y - creep.pos.y));

        tempTasks[difference + count] = task;
      } else {
        tempTasks[count + 100] = task;
      }
      count = count + 1;
    });
    const newList = Object.entries(tempTasks).sort((a, b) => Number(a[0]) - Number(b[0]));

    for (const key in newList) {
      const task = newList[key][1];
      if (task.canCreepHaveThisTask(creep)) {
        creep.memory.taskHash = task.hash;
        return task;
      }
    }
    return null;
  }
  completeTask(hash: number | string) {
    delete this.tasks[hash];
  }
  createSupplyTasks(miningContainers: Id<StructureContainer>[]) {
    const sites = this.manager.findInRooms(FIND_MY_CONSTRUCTION_SITES);
    if (sites.length === 0) {
      return;
    }

    const covered = SupplyTask.getActiveSupplyPositions(this.manager);

    for (let i = 0; i < miningContainers.length; i++) {
      const container = Game.getObjectById(miningContainers[i]);
      if (!container || container.store.getUsedCapacity(RESOURCE_ENERGY) <= 100) {
        continue;
      }

      const site = SupplyTask.pickBestSite(container, sites, covered, this.manager);
      if (!site) {
        continue;
      }

      const stagingPos = SupplyTask.findStagingPos(site);
      if (!stagingPos) {
        continue;
      }

      const energy = container.store.getUsedCapacity(RESOURCE_ENERGY);
      const task = new SupplyTask(container, site, stagingPos, energy);
      if (!this.addTaskToQueue(task)) {
        (this.tasks[task.hash] as SupplyTask).amount = energy;
      }
      covered.push({ pos: stagingPos, energy });
    }
  }
  log(content: string) {
    console.log(content);
  }
  init() {}
}
