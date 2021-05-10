import { Directive } from "directive"
import { Manager } from "manager";

export class DirectiveBase {


    global: Global;
    flag: Flag;
    type: string;
    manager: Manager | null;

    constructor(directive: Directive) {
        this.global = directive.global;
        this.flag = directive.flag;
        this.type = "";
        this.manager = directive.manager;
    }

    run() {
      throw new Error("Should not be run.");
    }
}
