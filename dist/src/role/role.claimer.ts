export class RoleClaimer {
    static run(creep: Creep) {
        if (creep.memory.taskHash) {
            creep.task = creep.manager.taskManager.tasks[creep.memory.taskHash];
            if (creep.task && !creep.task.isValid()) {
                if (creep.memory.taskHash) {
                    creep.manager.taskManager.completeTask(creep.memory.taskHash)
                }
                creep.memory.taskHash = null;
                creep.task = null;
            }
        }

        if (creep.task === null || creep.task === undefined) {
            creep.task = creep.manager.taskManager.getNewTask(creep);
        }
        if (creep.task) {
            creep.task.run(creep);
        }
    }
}
