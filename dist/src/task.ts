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
}

// module.exports = Task;
