import CacheMapping from "../../../src/annotation/CacheMapping";
import { CacheConfig } from "../../../src/CacheType";

@CacheMapping(__filename)
class NoclientMapping implements CacheConfig {
	store: string = "noclientStore";
	initSync: boolean = false;
}

export default NoclientMapping;
