import { Directive } from "directive"
import { Manager } from "manager";

export class DirectiveBase {

    flag: Flag;
    type: string;
    manager: Manager | null;

    constructor(directive: Directive) {
        this.flag = directive.flag;
        this.type = "";
        this.manager = directive.manager;
    }

    run() {
      throw new Error("Should not be run.");
    }
}
