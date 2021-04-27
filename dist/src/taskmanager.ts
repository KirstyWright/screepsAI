import { Manager } from "manager";
import { BuildTask } from "task.build";
import { RepairTask } from "task.repair";
import { CollectTask } from "task.collect";
import { Task } from "task";

export class TaskManager {
    manager: Manager;
    tasks: Record<string, Task>
    constructor(manager: Manager) {
        this.manager = manager;

        this.loadFromMemory();
        this.getNewTasks();
        this.tasks = {};
    }
    finish() {
        this.saveToMemory();
    }
    getNewTasks() {
        let targets = this.manager.findInRooms(FIND_MY_CONSTRUCTION_SITES);

        for (let key in targets) {
            let task = new BuildTask(targets[key])
            if (!this.tasks[task.hash]) {
                this.tasks[task.hash] = task;
            }
        }

        let secondTargets = this.manager.findInRooms(FIND_STRUCTURES, {
            filter: (object) => {
                if (!("hits" in object) || !("hitsMax" in object) || !("structureType" in object)) {
                    return false;
                }
                return (
                    (object.hits < object.hitsMax &&
                        (object.structureType !== STRUCTURE_WALL && object.structureType !== STRUCTURE_RAMPART)
                    )
                );
            }
        });

        for (let key in secondTargets) {
            let task = new RepairTask(secondTargets[key])
            if (!this.tasks[task.hash]) {
                this.tasks[task.hash] = task;
            }
        }

        // let list = this.manager.room.find(FIND_DROPPED_RESOURCES, {
        let list = this.manager.findInRooms(FIND_DROPPED_RESOURCES, {
            filter: (d) => {
                return d.resourceType == RESOURCE_ENERGY;
            }
        });
        let destination = null;
        if (this.manager.room.storage) {
            destination = this.manager.room.storage;
        } else {
            console.log('No Storage!!!');
            return;
        }

        for (let key in list) {
            let task = new CollectTask(list[key], destination, list[key].amount)
            if (!this.tasks[task.hash]) {
                this.tasks[task.hash] = task;
            }
        }

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
                default:
                    console.log("Invalid task " + hash);
                    continue;
            }
            if (task) {
                this.tasks[memoryTask.hash] = task
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
    getNewTask(creep: Creep): null|Task {
        for (let hash in this.tasks) {
            let task = this.tasks[hash];
            if (task.roles.includes(creep.memory.role)) {
                let numberOfAssigned = Object.values(Game.creeps).filter((cp) => {
                    return (cp.memory.taskHash && cp.memory.taskHash == task.hash);
                }).length;

                if (numberOfAssigned == 0) {
                    creep.memory.taskHash = task.hash;
                    return task;
                }
            }
        }
        return null;
    }
    completeTask(hash: string) {
        delete this.tasks[hash];
    }
    log(content: string) {}
    init() {}
}
