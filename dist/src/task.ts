import { Manager } from "manager";
export class Task {
    hash: number;
    type: string;
    roles: Array<String>;
    manager: Manager|null = null;

    constructor() {
        this.hash = 0;
        this.roles = [];
        this.type = 'none';
    }
    log(content: string) {
        console.log("Task:" + false + ': ' + String(content));
    }
    init() {
    }
    storageData(): Record<string, any> {
        return {}
    }
    isValid(): boolean {
        return false;
    }
    canCreepHaveThisTask(creep: Creep): boolean {

        if (!this.roles.includes(creep.memory.role)) {
            return false;
        }

        let numberOfAssigned = Object.values(Game.creeps).filter((cp) => {
            return (cp.memory.taskHash && cp.memory.taskHash == this.hash);
        }).length;

        if (numberOfAssigned == 0) {
            return true;
        }
        return false;
    }
}

// module.exports = Task;
