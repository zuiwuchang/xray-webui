import { DokodemoDoor } from "./dokodemo-door";
import { Http } from "./http";
import { ShadowsocksSettings } from "./shadowsocks";
import { Socks } from "./socks";
import { Trojan } from "./trojan";
import { VLess } from "./vless";
/**
 * {@link https://xtls.github.io/config/inbound.html}
 */
export type Inbounds = DokodemoDoor | Http | ShadowsocksSettings | Socks | Trojan | VLess