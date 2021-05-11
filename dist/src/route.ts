import { Helper } from "helper";

export class Route {
    id: Number;
    origin: RoomPosition;
    destination: RoomPosition;

    constructor(origin: RoomPosition, destination: RoomPosition) {
        this.origin = origin;
        this.destination = destination;
        this.id = (Helper.savePos(origin) + '.' + Helper.savePos(destination)).hashCode();

        this.init();
    }

    init() {
        if (!Memory.routes) {
            Memory.routes = {};
        }


    }

    run() {

    }

}
