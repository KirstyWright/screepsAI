import { DirectiveBase } from "./base";
import { Directive } from "directive";
import { ScoutTask } from "task.scout";

export class DirectiveScout extends DirectiveBase {

    constructor(directive: Directive) {
        super(directive);
        this.type = 'scout';
    }

    run() {
        if (!this.manager) {
            return;
        }
        if (!Game.rooms[this.flag.pos.roomName]) {
            let task = new ScoutTask(this.flag.pos.roomName);
            this.manager.taskManager.addTaskToQueue(task);
        }
        console.log(this.flag.remove());
    }

}
