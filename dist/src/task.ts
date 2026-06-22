import { Manager } from "manager";
export abstract class Task {
  hash: number;
  type: string;
  roles: string[];
  manager: Manager | null = null;

  constructor() {
    this.hash = 0;
    this.roles = [];
    this.type = "none";
  }

  abstract run(creep: Creep): void;

  log(content: string) {
    console.log("Task:" + false + ": " + String(content));
  }
  init() {}
  storageData(): ManagerMemoryTask {
    return {
      type: this.type,
      hash: this.hash
    };
  }
  isValid(): boolean {
    return false;
  }
  canCreepHaveThisTask(creep: Creep): boolean {
    if (!this.roles.includes(creep.memory.role)) {
      return false;
    }

    const numberOfAssigned = Object.values(Game.creeps).filter(cp => {
      return cp.memory.taskHash && cp.memory.taskHash == this.hash;
    }).length;

    if (numberOfAssigned == 0) {
      return true;
    }
    return false;
  }
}
