import { Manager } from "./../manager";
export class Group {
  requiredCreeps: string[] = [];
  stage: string = "RECRUITING";
  creeps: Creep[] = [];
  name: string = "";
  manager: Manager | null = null;
  type: string;
  hash: number;
  recruitWhenEnded: boolean = false;

  constructor() {
    this.hash = 0;
    this.type = "none";
  }

  init() {}

  log(content: string) {
    console.log("Group:" + this.type + "-" + this.hash + ": " + String(content));
  }

  storageData(): ManagerMemoryGroup {
    return {
      type: this.type,
      hash: this.hash
    };
  }

  run() {}

  static buildFromMemory(memoryRecord: ManagerMemoryGroup): Group | false {
    if (!memoryRecord.type) {
      return false;
    }

    return new Group();
  }

  deleteGroup() {
    this.log("Auto purging group");
    this.type = "pendingDeletion";
  }
}
