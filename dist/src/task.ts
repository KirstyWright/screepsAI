export class Task {
    hash: number;
    roles: Array<String>;
    constructor() {
        this.hash = 0;
        this.roles = [];
    }
    log(content: string) {
        console.log("Task:" + false + ': ' + String(content));
    }
    init() {
    }
    storageData(): Record<string, any> {
        return {}
    }
}

// module.exports = Task;
