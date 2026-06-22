import { CachedStructure } from "./structure";
import { CachedCreep } from "./creep";
import { CachedBase } from "./base";

export class CachedRoom extends CachedBase {
  structures: Record<string, CachedStructure>;
  creeps: Record<string, CachedCreep>;

  constructor(room: Room) {
    super();
    this.structures = {};
    this.creeps = {};
    // this.structures = new CachedStructure(room.find(FIND_STRUCTURES));
  }
}
