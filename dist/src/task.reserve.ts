import { Task } from "task";
export class ReserveTask extends Task {
    type: string;
    roles: string[];
    hash: number;
    target: string;

    static buildFromMemory(memoryRecord: Record<string, any>) {

        let target = memoryRecord.target;
        if (!target) {
            return false;
        }

        return new ReserveTask(
            target
        );
    }

    constructor(target: string) {
        super()
        this.type = 'reserve';
        this.roles = ['claimer'];
        this.target = target;
        this.hash = String("reserve" + target).hashCode();
    }

    storageData(): Record<string, any> {
        return {
            hash: this.hash,
            type: this.type,
            target: (this.target ? this.target : null)
        }
    }
    run(creep: Creep) {
        if (creep.pos.roomName != this.target) {
            creep.moveToPos(new RoomPosition(25, 25, this.target));
        } else {
            let room = Game.rooms[this.target];
            if (room && room.controller) {
                let result = creep.reserveController(room.controller);
                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveToPos(room.controller);
                }
            } else {
                console.log('OH NO !');
            }
        }
    }
    isValid() {
        if (this.target == undefined || this.target == null) {
            return false;
        }
        if (Game.rooms[this.target] && Game.rooms[this.target].controller) {
            let room = Game.rooms[this.target];
            if (room.controller) {
                if (room.controller.my) {
                    return false;
                }
                if (room.controller.reservation && room.controller.reservation.ticksToEnd >= 5000) {
                    return false;
                }

            }
        }
        return true;
    }
}
