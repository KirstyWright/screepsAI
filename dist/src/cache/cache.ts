import { CachedRoom } from "./room";
import { CachedStructure } from "./structure";

export class Cache {
  cacheMap() {
    const rooms = {};
  }
  cacheRoom(room: Room): void {
    const result = new CachedRoom(room);
  }
}
