import { DirectiveBase } from "./base";
import { Directive } from "directive";
import { GroupCombat } from "./../group/combat";

export class DirectiveCombat extends DirectiveBase {

    constructor(directive: Directive) {
        super(directive);
        this.type = 'combat';
    }

    run() {
        if (!this.manager) {
            return;
        }

        if (!Game.rooms[this.flag.pos.roomName]) {

        }
        let cgroup = new GroupCombat("RECRUITING", this.flag.pos.roomName, false);
        if (!this.manager.groupManager.groups[cgroup.hash]) {
            this.manager.groupManager.addGroup(cgroup);
        }
    }

}
