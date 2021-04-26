let BuildTask = require('task.build');
let RepairTask = require('task.repair');
class TaskManager {
    constructor(manager) {
        this.manager = manager;

        this.loadFromMemory();
        this.getNewTasks();

    }
    finish() {
        this.saveToMemory();
    }
    getNewTasks() {
        let targets = this.manager.findInRooms(FIND_CONSTRUCTION_SITES);

        for (let key in targets) {
            let task = new BuildTask(targets[key])
            if (!this.tasks[task.hash]) {
                this.tasks[task.hash] = task;
            }
        }

        targets = this.manager.findInRooms(FIND_STRUCTURES, {
            filter: (object) => {
                return (
                    (object.hits < object.hitsMax &&
                        (object.structureType !== STRUCTURE_WALL && object.structureType !== STRUCTURE_RAMPART)
                    )
                );
            }
        });

        for (let key in targets) {
            let task = new RepairTask(targets[key])
            if (!this.tasks[task.hash]) {
                this.tasks[task.hash] = task;
            }
        }


    }
    loadFromMemory() {
        this.tasks = {};
        for (let hash in this.manager.memory.tasks) {
            let memoryTask = this.manager.memory.tasks[hash];
            var task = null
            switch (memoryTask.type) {
                case "build":
                    task = new BuildTask(memoryTask)
                    break;
                case "repair":
                    task = new RepairTask(memoryTask)
                    break;
                default:
                    console.log("Invalid task " + hash);
                    continue;
            }
            this.tasks[memoryTask.hash] = task
        }
    }
    saveToMemory() {
        this.manager.memory.tasks = {};
        let list = {};
        for (let hash in this.tasks) {
            let task = this.tasks[hash];
            list[task.hash] = {
                hash: task.hash,
                type: task.type,
                target: (task.target ? task.target.id : null)
            }
        }
        this.manager.memory.tasks = list;
    }
    getNewTask(creep) {
        for (let hash in this.tasks) {
            let task = this.tasks[hash];
            if (task.roles.includes(creep.memory.role)) {
                let numberOfAssigned = Object.values(Game.creeps).filter((cp) => {
                    return (cp.memory.taskHash && cp.memory.taskHash == task.hash);
                });

                if (numberOfAssigned == 0) {
                    creep.memory.taskHash = task.hash;
                    console.log("New Task assigned " + task.hash + " to " + creep.name);
                    return task;
                }
            }
        }
    }
    completeTask(hash) {
        delete this.tasks[hash];
    }
    log(content) {}
    init() {}
}

module.exports = TaskManager;
