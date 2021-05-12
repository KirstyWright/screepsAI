import { Task } from "task";
export class ScoutTask extends Task {
    type: string;
    roles: string[];
    hash: number;
    target: string;
    completed: boolean = false;

    static buildFromMemory(memoryRecord: Record<string, any>) {

        let target = memoryRecord.target;
        if (!target) {
            console.log('invalid task scout');
            return false;
        }

        let completed = memoryRecord.completed;
        if (typeof completed === 'undefined') {
            completed = false;
        }

        return new ScoutTask(
            target,
            completed
        );
    }

    constructor(target: string, completed?: boolean) {
        super()
        this.type = 'scout';
        this.roles = ['scout'];
        this.target = target;
        this.completed = typeof completed === 'boolean' ? completed : false;
        this.hash = String("scout" + target).hashCode();
    }

    storageData(): Record<string, any> {
        return {
            hash: this.hash,
            type: this.type,
            target: this.target,
            completed: this.completed
        }
    }
    run(creep: Creep) {
        creep.travelTo(new RoomPosition(25, 25, this.target));
        if (creep.pos.roomName === this.target) {
            // if (creep.manager.rooms.includes(this.target)) {
            // creep.manager.addRoom(this.target);
            // creep.log("Adding room "+this.target)
            //
            this.completed = true;
        }

    }
    isValid() {
        if (this.completed) {
            return false;
        }
        if (this.target == undefined || this.target == null) {
            return false;
        }
        if (Game.rooms[this.target] && Game.rooms[this.target].controller) {
            let room = Game.rooms[this.target];
            if (room.controller) {
                if (room.controller.my) {
                    return false;
                }
                if (room.controller.reservation) {
                    return false;
                }

            }
        }
        return true;
    }
}
