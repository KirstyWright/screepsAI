import { Manager } from "./../manager";
export class Group {
    requiredCreeps: string[] = [];
    stage: string = "RECRUITING";
    creeps: Creep[] = []
    name: string = ''
    manager: Manager|null = null
    type: string;
    hash: number;

    constructor() {
        this.hash = 0;
        this.type = 'none';
    }

    init() {

    }

    log(content: string) {
        console.log("Group:" + this.type + "-"+ this.hash + ': ' + String(content));
    }

    storageData(): Record<string, any> {
        return {}
    }

    run() {

    }

    static buildFromMemory(memoryRecord: Record<string, any>) {

        let target = memoryRecord.target;
        if (!target) {
            return false;
        }

        return new Group();
    }
}
