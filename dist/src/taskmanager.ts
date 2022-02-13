import { Manager } from "manager";
import { BuildTask } from "task.build";
import { RepairTask } from "task.repair";
import { CollectTask } from "task.collect";
import { ReserveTask } from "task.reserve";
import { Task } from "task";
import { ScoutTask } from "task.scout";

export class TaskManager {
    manager: Manager;
    tasks: Record<string, Task>
    constructor(manager: Manager) {
        this.manager = manager;
        this.tasks = {};

        this.loadFromMemory();
        this.getNewTasks();
    }
    finish() {
        this.saveToMemory();
    }
    getTasksByType(type: string): Task[] {
        return Object.values(this.tasks).filter((task) => {
            return task.type == type;
        });
    }
    getNewTasks() {
        let targets = this.manager.findInRooms(FIND_MY_CONSTRUCTION_SITES);
        for (let key in targets) {
            let task = new BuildTask(targets[key])
            this.addTaskToQueue(task);
        }

        let secondTargets = this.manager.findInRooms(FIND_STRUCTURES, {
            filter: (object) => {
                if (!("hits" in object) || !("hitsMax" in object) || !("structureType" in object)) {
                    return false;
                }
                let hits = object.hitsMax * (1 - 0.1);
                return (
                    (object.hits < hits &&
                        (object.structureType !== STRUCTURE_WALL && object.structureType !== STRUCTURE_RAMPART)
                    ) || (
                        (object.structureType === STRUCTURE_WALL || object.structureType === STRUCTURE_RAMPART)
                        && object.hits < this.manager.wallStrength
                    )
                );
            }
        });

        for (let key in secondTargets) {
            let task = new RepairTask(secondTargets[key])
            this.addTaskToQueue(task);
        }

        // let list = this.manager.room.find(FIND_DROPPED_RESOURCES, {
        let list: (Resource | Ruin | Tombstone)[] = [];
        list = this.manager.findInRooms(FIND_DROPPED_RESOURCES, {
            filter: (d) => {
                return d.resourceType == RESOURCE_ENERGY && d.amount > 300;
            }
        });

        list = list.concat(this.manager.findInRooms(FIND_RUINS));
        list = list.concat(this.manager.findInRooms(FIND_TOMBSTONES));


        // Get collection source
        let miningContainers: Array<Id<StructureContainer>> = [];
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
            let list = this.manager.room.find(FIND_MY_STRUCTURES, {
                filter: (structure: StructureExtension | StructureSpawn) => {
                    return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });

            if (list.length == 0) {
                let newlist = this.manager.room.find(FIND_STRUCTURES, {
                    filter: (structure: StructureContainer) => {
                        if (structure.structureType != STRUCTURE_CONTAINER) {
                            return false;
                        }
                        return (!miningContainers.includes(structure.id) && structure.structureType == STRUCTURE_CONTAINER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                    }
                });
                destination = <StructureContainer>newlist[0];
            }

            if (!destination) {
                destination = <StructureExtension | StructureContainer | StructureSpawn>list[0];
            }
        }
        if (!destination) {
            return; // Temp but not so temp it seems -_-
        }

        for (let i = 0; i < miningContainers.length; i++) {
            let container = Game.getObjectById(miningContainers[i]);
            if (container && container.store.getUsedCapacity(RESOURCE_ENERGY) > 100 && destination) {
                let task = new CollectTask(container, destination, container.store.getUsedCapacity(RESOURCE_ENERGY));
                if (!this.addTaskToQueue(task)) {
                    (<CollectTask>this.tasks[task.hash]).amount = container.store.getUsedCapacity(RESOURCE_ENERGY);
                }
            }
        };


        // Fill containers
        if (this.manager.room.storage) {
            let containerList = <StructureContainer[]>this.manager.room.find(FIND_STRUCTURES, {
                filter: (structure: StructureContainer) => {
                    if (structure.structureType != STRUCTURE_CONTAINER) {
                        return false;
                    }
                    return (!miningContainers.includes(structure.id) && structure.structureType == STRUCTURE_CONTAINER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                }
            });

            for (let i = 0; i < containerList.length; i++) {
                let container = containerList[i];
                let task = new CollectTask(this.manager.room.storage, container, container.store.getFreeCapacity(RESOURCE_ENERGY));
                if (!this.addTaskToQueue(task)) {
                    (<CollectTask>this.tasks[task.hash]).amount = container.store.getFreeCapacity(RESOURCE_ENERGY);
                }
            }

        }

        for (let key in list) {
            let item = list[key];
            let amount = 0;

            if ("amount" in item) {
                amount = item.amount;
            } else if ("store" in item) {
                amount = item.store.getUsedCapacity(RESOURCE_ENERGY);
            }

            let task = new CollectTask(list[key], destination, amount);
            if (!this.addTaskToQueue(task)) {
                if ((<CollectTask>this.tasks[task.hash]).amount !== amount && Math.abs((<CollectTask>this.tasks[task.hash]).amount - amount)) {
                    (<CollectTask>this.tasks[task.hash]).amount = amount;
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
        for (let hash in this.manager.memory.tasks) {
            let memoryTask = this.manager.memory.tasks[hash];
            var task: Task | false;
            switch (memoryTask.type) {
                case "build":
                    task = BuildTask.buildFromMemory(memoryTask)
                    break;
                case "repair":
                    task = RepairTask.buildFromMemory(memoryTask)
                    break;
                case "collect":
                    task = CollectTask.buildFromMemory(memoryTask)
                    break;
                case "reserve":
                    task = ReserveTask.buildFromMemory(memoryTask)
                    break;
                case "scout":
                    task = ScoutTask.buildFromMemory(memoryTask)
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
        this.manager.memory.tasks = {};
        let list: Record<string, any> = {};
        for (let hash in this.tasks) {
            let task = this.tasks[hash];
            list[task.hash] = task.storageData();
        }
        this.manager.memory.tasks = list;
    }
    getNewTask(creep: Creep): null | Task {
        for (let hash in this.tasks) {
            let task = this.tasks[hash];
            if (task.canCreepHaveThisTask(creep)) {
                creep.memory.taskHash = task.hash;
                return task;
            }
        }
        return null;
    }
    completeTask(hash: string) {
        delete this.tasks[hash];
    }
    log(content: string) {
        console.log(content);
    }
    init() { }
}
