export class Helper {
    static savePos(pos: RoomPosition): string {
        return pos.x + ":" + pos.y + ":" + pos.roomName;
    }

    static loadPos(stringPos: string): RoomPosition {
        let list = stringPos.split(":")
        return new RoomPosition(Number(list[0]), Number(list[1]), list[2]);
    }
}
