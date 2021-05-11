import { Directive } from "directive";
import { Manager } from "manager";
import { Route } from "route";

export class Tick {

    static managers: Manager[] = [];
    static directives: Directive[] = [];
    static Profiler: any
    static routes: Record<number, Route> = {}

    constructor() {
    }


}
