import { DirectiveBase } from "./base";
import { Directive } from "directive";
import { ReserveTask } from "task.reserve";


export class DirectiveMine extends DirectiveBase {

    constructor(directive: Directive) {
        super(directive);
        this.type = 'mine';
    }

    run() {
        if (!this.manager) {
            return;
        }

        let roomName = this.flag.pos.roomName;

        // if sources are not in room object then add them

        // add reserve command if appropiate
        let roomObject = Game.rooms[roomName];
        let reserveFlag = true;
        if (roomObject && roomObject.controller && roomObject.controller.my) {
            reserveFlag = false;  // I own the room
        } else {
            if (roomObject && !roomObject.controller) {
                reserveFlag = false; // Can't claim room
            }
            if (!roomObject || roomObject.controller) {  // need to scout
                if (roomObject && roomObject.controller) {
                    if (roomObject.controller.reservation && roomObject.controller.reservation.ticksToEnd > 2500) {
                        // console.log('2500 ticks left so dont bother for room '+roomObject.name);
                        reserveFlag = false;  // 2500 ticks left on reserving so don't bother
                    }
                }
            }
        }
        if (reserveFlag) {
            // let task = new ReserveTask(roomName)
            // this.manager.taskManager.addTaskToQueue(task);
        }

        if (Game.time % 10 == 0) {
            // this.manager.addRoom(roomName);
        }

    }

}
