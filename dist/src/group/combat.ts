import { Group } from "./group";

export class GroupCombat extends Group {
    run() {
    }

    static buildFromMemory(memoryRecord: Record<string, any>): GroupCombat|false{

        let target = memoryRecord.target;
        if (!target) {
            return false;
        }

        return new GroupCombat();
    }
};
