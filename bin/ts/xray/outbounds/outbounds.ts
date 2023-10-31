import { Blackhole } from "./blackhole";
import { DNS } from "./dns";
import { Freedom } from "./freedom";
import { Shadowsocks } from "./shadowsocks";
import { Socks } from "./socks";
import { Trojan } from "./trojan";
import { VLess } from "./vless";
import { VMess } from "./vmess";

/**
 * {@link https://xtls.github.io/config/outbound.html}
 */
export type Outbounds = Blackhole | DNS | Freedom | Shadowsocks | Socks | Trojan | VLess | VMess

