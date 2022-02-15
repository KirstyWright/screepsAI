import { DirectiveBase } from "./base";
import { Directive } from "directive";
import { GroupDismantle } from "./../group/dismantle";

export class DirectiveAssault extends DirectiveBase {

    constructor(directive: Directive) {
        super(directive);
        this.type = 'assault';
    }

    run() {
        if (!this.manager) {
            return;
        }

        if (!Game.rooms[this.flag.pos.roomName]) {

        }
        let group = new GroupDismantle("RECRUITING", this.flag.pos.roomName);
        if (!this.manager.groupManager.groups[group.hash]) {
            console.log('need a group')
            this.manager.groupManager.addGroup(group);
        }
    }

}
