# xray-webui

xray-webui 是 xray 的一個跨平臺(桌面系統) webui，爲 linux windows mac 提供了一致的使用體驗。

默認設定下在運行主程式後需要使用瀏覽器訪問 [http://127.0.0.1:1989](http://127.0.0.1:1989) 來訪問 ui，它會要求你輸入默認的用戶名 killer , 以及默認的密碼 19890604


xray-webui 支持了 es6 [腳本](#腳本)，你可以通過修改腳本來支持最新的 xray 特性。或者將底層對 xray 的調用替換成爲任何其它的類似軟體。

Index:
* [安裝](#安裝)
* [運行](#運行)
* [更新](#更新)
* [設定](#設定)
* [腳本](#腳本)
* [userdata](#userdata)
* [代理策略](#代理策略)
* [透明代理](#透明代理)
    * [linux tproxy](#linux-tproxy)
    * [linux redirect](#linux-redirect)
    * [windows](#windows-tun2socks)
    * [mac](#mac)
* [docker](#docker)
* [代理網關](#代理網關)

![](preview.gif)

# 安裝

1. [下載](https://github.com/zuiwuchang/xray-webui/releases)最新壓縮包並解壓
2. 下載最新的 [xray](https://github.com/XTLS/Xray-core/releases) 並解壓到 xray-webui 所在路徑的 xray 檔案夾下。

## linux 開機啓動

對於支持 systemd 的系統，你可以將 xray-webui.service 複製到 **/etc/systemd/system/** 檔案夾下並且啓用服務

```
# 創建服務
cp xray-webui.service /etc/systemd/system/

# 設置開機啓動
systemctl enable xray-webui.service

# 禁用開機啓動
# systemctl disable xray-webui.service

# 啓動服務
systemctl start xray-webui.service

# 關閉服務
# systemctl start xray-webui.service

# 查詢服務運行狀態
systemctl status xray-webui.service
```


> 此外如果你的程式不是安裝在 /opt/xray-webui 檔案夾中，要記得修改 xray-webui.service 中 ExecStart 屬性指定的啓動路徑

## windows 開機啓動

對於 windows 使用 WinSW 將其包裝成了服務，你可以使用管理員權限運行下述指令

```
@REM 安裝服務
xray-webui-service.exe install

@REM 卸載服務
xray-webui-service.exe uninstall
```

服務安裝成功的化會在系統重啓後自動運行，如果要立刻運行你可以在 windows 服務管理界面打開或關閉 xray-webui-service 服務


# 運行

使用下述指令運行程式

```
xray-webui web
```

你可以使用 -h 參數查看更詳細的使用方法

```
xray-webui web -h
```

# 更新

本程序只是一個界面 ui，它簡化了對 xray 的使用，通常不需要更新也很少有增加新特性。如果更新了特性你重新下載覆蓋掉主程序即可。

此外你應該關注 xray 的更新，當 xray 更新後下載最新的 xray 解壓到主程序所在位置的 xray 檔案夾即可。

此外當 xray 支持了新特性或協議時，腳本可能會更新，你可以[下載](https://github.com/zuiwuchang/xray-webui/releases/tag/scripts)最新腳本覆蓋掉主程序所在位置的 js 檔案夾即可

# 設定

設定檔是一個 [jsonnet](https://jsonnet.org/)，如果你不理解 jsonnet 你可以簡單的把它看作是一個比較容易書寫的 json。默認的設定檔都在主程序所在位置的 etc 檔案夾下

通常你只需要修改 ./etc/cnf/http.libsonnet 中的 Addr 來修改 webui 的監聽端口，以及 Accounts 來替換掉默認的管理用戶名密碼就好

# 腳本

xray-webui 默認加載一個 js(js/main.js) 腳本，腳本必須導出一個 `export function create(): Provider` 函數

Provider 會橋接網頁 ui 以及對底層 xray 的調用，main.d.ts 中有詳細的定義，此外 ts 檔案夾下存放了一個官方維護的腳本，你可以參考它按需編寫自己的腳本

```
/**
    * 爲網頁 ui 提供了各種功能的具體實現
    */
export interface Provider {
    /**
    * 銷毀 Provider 和其綁定的資源
    */
    destroy?: () => void
    /**
    * 返回底層 xray 版本
    */
    version(): string
    /**
    * 返回透明代理設定
    */
    firewall(): string
    /**
    * 啓動透明代理
    */
    turnOn(opts: TurnOptions): void
    /**
    * 關閉透明代理
    */
    turnOff(opts: TurnOptions): void

    /**
    * 返回支持的節點元信息
    */
    metadata(): Array<Metadata>

    /**
    * 返回配置
    */
    configure(opts: ConfigureOptions): ConfigureResult

    /**
    * 返回啓動代理的命令
    * @param cnf 設定檔案路徑
    * @param opts 生成設定檔的原始參數
    */
    serve(cnf: string, opts: ConfigureOptions<Userdata>): ServeResult
}
```

* **destroy** 每次響應用戶 ui 請求時，都會調用腳本的 create 函數創建 Provider 實例，並在 實例不需要時調用 destroy(如果存在) 釋放資源
* **version** 返回 xray 版本號供網頁顯示，它只會被加載一次之後會被存儲在服務器緩存中
* **metadata** 返回了一個元信息，網頁 ui 會依據它爲各種協議生成輸入 ui，同時系統也會依據它的定義來解析與生成代理節點的訂閱信息
* **configure** 這個函數應該爲 xray 生成設定檔案的內容，以供後續使用它來啓動 xray
* **serve** 這個函數應該返回啓動 xray 的命令，cnf 是存儲了 configure 生成內容的檔案路徑

一些系統支持設置透明代理(目前官方只維護了 linux windows 腳本)，你可以修改下述三個函數來自定義如何啓動與關閉你所在平臺的透明代理

* **firewall** 它返回的內容會被顯示到網頁 `/settings/firewall` 頁面。用於顯示當前透明代理設定(linux 目前只是打印了 iptables-save 設定)
* **turnOn** 它在用戶點擊網頁上的**啓用透明代理**等按鈕時被調用。(linux 目前是調用了 iptable 設置代理規則)
* **turnOff** 它在用戶點擊網頁上的**關閉透明代理**等按鈕時被調用。(linux 目前是調用了 iptable 設置刪除了 turnOn 時設置的規則)

# userdata

在網頁 /settings/general 頁面可以設置一個自定義的 userdata。它的格式是 [jsonnet](https://jsonnet.org/) 會被轉爲 json 傳遞給腳本。如果不了解 jsonnet 你可以把它簡單的理解成爲一個比較容易書寫的  json。

userdata 的內容完全由腳本決定如何使用。通常是一些代理相關的設定選項。

# 代理策略

對於不同的用戶可能希望不同的代理方案。例如大部分朝鮮普通用戶主要訪問朝鮮流量，這時將沒有識別出流量歸屬的流量直接訪問比較合理；而朝鮮的漢奸主要訪問朝鮮境外流量，這時將沒有識別出流量歸屬的流量通過代理訪問比較合理。本程式使用了策略來解決滿足不同需求，不同策略會爲用戶生成不同的代理規則，包含如下6個策略

* **默認策略**
* **全域代理**
* **公網代理**
* **代理優先**
* **直連優先**
* **直接連接**

所有策略可以在網頁 **/settings/strategy** 頁面，爲這個策略設置靜態域名([hosts](https://xtls.github.io/config/dns.html#dnsobject))，以及訪問的 域名([domain](https://xtls.github.io/config/routing.html#ruleobject)) 或 [ip](https://xtls.github.io/config/routing.html#ruleobject)  應該直連訪問或者代理訪問或是被阻止訪問

“默認策略”的設定會被其它策略繼承，所以在它裏面設定你想要的全局規則。而其它策略的設定只在用戶選擇使用此策略啓動代理時才會被採用，因爲你可以爲不同策略寫它單獨的設定。

> “默認策略”之外的策略被使用時(比如策略 X)，程式會讀取 “默認策略”的設定，然後讀出 X 策略的設定，之後將兩個設定合併去重後傳入腳本，腳本依據設定產生設定檔案


| 策略名稱 | 腳本產生代理規則 | 應用場景  | 普通用戶  | 可能產生的問題  |
| --- | --- | --- | --- | --- |
| 默認策略  | 目前會產生和 代理優先 一樣的規則，但後續可能會改變  | 目前尚未明確行爲，通常不建議採用  | ✓  | 更新腳本或程式後代理規則可能會發生改變  |
| 全域代理  | 除了明確指定(可在 /settings/strategy 和 userdata 中指定) 直連的流量其它都通過代理訪問  |  對所有網路隱藏真實IP  | ✗  | 訪問朝鮮流量慢或無法訪問，無法訪問區域網路或訪問到服務器所在的區域網路  |
| 公網代理  | 只對公網 ip 進行代理訪問，私有網路地址直接訪問  | 對互聯網隱藏真實 IP | ✗  | 訪問朝鮮流量慢或無法訪問  |
| 代理優先  | 對朝鮮流量和私有地址直接訪問，朝鮮之外和非私有地址使用代理訪問。無法識別的流量使用代理訪問  | 主要訪問朝鮮之外的流量  | ✓  | 一些朝鮮流量無法正確識別，導致被代理訪問從而無法訪問或訪問慢，解決方法是手動設置這些流量直接訪問  |
| 直連優先  | 對朝鮮流量和私有地址直接訪問，朝鮮之外和非私有地址使用代理訪問。無法識別的流量使用直接訪問  | 主要訪問朝鮮流量  | ✓  | 一些非朝鮮流量無法正確設備，導致這些流量直接訪問從而無法訪問或訪問慢，解決方法是手動設置這些流量使用代理訪問  |
| 直接連接  | 除了明確指定代理的流量其它都直接訪問  | 只訪問特定的非朝鮮流量，例如只訪問 Netflix/DisneyPlus  | ✗  |  所有代理流量都需要手動設置很繁瑣，也可能設置不全或服務商更新了資源域名ip導致無法訪問 |

> 大部分用戶請直接選擇 **代理優先** 或  **直連優先** 即可滿足絕大部分需求

# 透明代理

透明代理可以讓系統上所有程序都通過代理訪問網路，但不同平臺支持方式和程度各異，如果無法正常工作你可能需要依據你的實際情況修改腳本。

如果平臺支持，你可以在網頁 ui 中點擊 開啓透明代理/關閉透明代理 等按鈕來 開啓/關閉 代理。這兩個按鈕實際上只是調用了腳本的 turnOn/turnOff 函數。

> 設置透明代理通常都需要系統管理員權限才能修改系統設定，所以如果要使用此功能請確保 xray-webui 運行在管理員權限下

## linux-tproxy

tproxy 擁有最完整的支持，它可以正確代理 udp/tcp。並且 xray 的路由可以正常工作，這意味這它可以正確分流朝鮮和非朝鮮的流量。

默認腳本需要將 userdata 中 proxy.tproxy 設置爲 true 才會啓用此功能。

> 切換了 tproxy/redirect 模式後，需要重啓 xray 進程後再啓用透明代理。因爲不同模式需要生成不同的 xray 設定。

## linux-redirect

一些舊的系統或者 windwos 的 wsl 子系統中 tproxy 可能無法被完整的支持，此時只能使用 redirect 模式。要啓用 redirect 模式需要設置 proxy.tproxy 爲 true 之外的值

> 切換了 tproxy/redirect 模式後，需要重啓 xray 進程後再啓用透明代理。因爲不同模式需要生成不同的 xray 設定。

redirect 只代理了 tcp 數據，並且因爲無法區分 xray 出棧流量所以除了到服務器和私有地址之外的所有地址都將使用代理訪問。這意味着任何策略和 xray 的路由都無法正常工作，所有流量都將經過代理而無法分流朝鮮和非朝鮮。

redirect 模式下只處理了 tcp 數據，所以遇到 dns 污染無能爲力，但你可以在 userdata 中設置一個 proxy.dns 值 (後續例子中假設它被設置爲 '127.0.0.1:10053')，這樣在啓動透明代理時腳本會自動創建下述規則將 dns 流量重新定位到一個無污染的 dns 服務器

```
iptables -t nat -D OUTPUT -p udp -m udp --dport 53 -j DNAT --to-destination 127.0.0.1:10053
iptables -t nat -D OUTPUT -p tcp -m tcp --dport 53 -j DNAT --to-destination 127.0.0.1:10053
```

此時我們還需要在 127.0.0.1:10053 上準備一個無污染的 dns，你可以使用 [coredns](https://github.com/coredns/coredns) 來輕鬆實現，只需要運行：

```
coredns -conf Corefile
```

Corefile 是設定檔案在本例子中可以按照如下填寫:

```
.:10053 {
	cache
	forward . 8.8.8.8 {
		force_tcp
	}
}
```

> 上述設定將在 任意地址上的 10053 端口上創建一個以 google 8.8.8.8 爲後端的 dns 服務，同時啓動了緩存並且和 8.8.8.8 間使用 tcp 通信。redirect 模式會自動將到 8.8.8.8 的 tcp 連接通過代理訪問所以不會被朝鮮投毒的 dns 污染。

# windows-tun2socks

windows 下需要使用 tun2socks 來支持透明代理，它將創建一個虛擬網卡並且通過修改路由規則來實現透明代理。它面臨的問題和 linux-redirect 類似，無法識別出 xray 的出棧流量，所以只能將到 xray 服務器的流量放行，其它的流量則都通過代理訪問。這導致策略和 xray 的路由都會失效，無法對朝鮮和非朝鮮流量進行分流

tun2socks 使用了 [https://github.com/xjasonlyu/tun2socks](https://github.com/xjasonlyu/tun2socks) 和 [https://www.wintun.net/](https://www.wintun.net/) 已經被打包到 tun2socks 檔案夾下，你或許可以從它們各自的官網更新這兩個套件到最新版本

userdata 中的 proxy.tun2socks 定義了 tun2socks 相關設定

```
 {
	// socks5 代理地址 ip:port，默認爲 127.0.0.1:${userdata.proxy.port}
	// socks5: '192.168.1.1:1080',
	// 系統默認上網網關 ip
	gateway: '192.168.1.1',
	// 虛擬網卡使用的 dns 服務器 ip 地址，不能帶端口 
	dns: '8.8.8.8',
	// tun2socks 虛擬網卡 ip
	addr: '192.168.123.1',
	// tun2socks 虛擬網卡 子網掩碼
	mask: '255.255.255.0',
}
```

通常你只需要修改 gateway 爲你實際上網的網關地址，其它保持默認設定即可。當你點擊網頁上的啓動透明代理按鈕時，服務器會啓動一個 tun2socks 服務，並且修改 windows 的默認路由將到服務器以及 socks5 代理的地址路由到 gateway 填寫的網關地址 ，並將其它流量路由到虛擬的 tun2socks 網卡從而到達代理的目的。

當你點擊網頁上的關閉透明代理按鈕時，服務器會關閉 tun2socks 服務，同時修改 windows 的路由規則將之前設置到虛擬網卡的流量重新路由到 gateway 填寫的網關地址

> tun2socks 支持 udp 流量所以與 linux-redirect 相比不會存在 dns 污染問題。
> 你可以不使用本機的 socks5 代理(userdata.proxy.port)，而是使用一個局域網內的 socks5 代理，此時可以將它填寫到 tun2socks.socks5 這樣局域網內的 socks5 因爲不受本機路由的影響，所以可以正確的處理 xray 的路由規則實現爲朝鮮和非朝鮮流量分流

# mac

因爲我沒有 mac 的設備所以沒有使用過這個系統，也無法進行調試。目前你需要自己修改腳本來支持它。但 mac 好像使用了類似 linux 的 iptables 架構，你或許可以參考下 linux 的腳本實現。

此外如果你改好了腳本，很歡迎你 pull 一個 commit 我會將它合併到項目以方便其它 mac 用戶使用

# docker

通常如果你只是爲了突破朝鮮的網路封鎖不建議使用 docker 運行本程式它會讓你本機的網路環境顯得複雜，並且在使用 docker 時可能並不容易修改 js 腳本。

在 docker 中使用本程序的真正價值在於和 [code-server](https://github.com/coder/code-server) 一起使用，code-server 在瀏覽器上提供了一個 vscode 環境，docker 提供了一個與主機獨立的虛擬網路，xray-webui+xray+iptables 爲這個獨立的虛擬網路提供了突破朝鮮封鎖的網路環境，藉助這些工具你可以方便的搭建一個能夠訪問到自由網路的 vscode  開發環境。對於這個方案本喵已經使用很多年你可以參考 [https://github.com/powerpuffpenguin/development-images](https://github.com/powerpuffpenguin/development-images)，這是本喵使用此方案創建的一些特定開發環境。

下面是一個 docker-compose 使用此方案的極簡例子

```
services:
  # coder-server 在瀏覽器上提供一個 vscode 的代碼編寫環境
  code:
    image: lscr.io/linuxserver/code-server:latest
    environment:
      # 更多設定請查看 https://hub.docker.com/r/linuxserver/code-server
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Shanghai
      - PASSWORD=123 #optional
    ports:
      - 9443:8443
      - 9000:1989
    restart: always

  # xray 和 webui 用於爲容器提供透明代理
  xray:
    image: king011/xray-webui:v0.0.4
    restart: always
    cap_add:
      - NET_ADMIN
      - NET_RAW
    volumes:
      - ./docker/data/:/data
      - ./bin/db.json:/db.json:ro
    environment:
      - XRAY_IMPORT=/db.json # 第一次運行容器時導入設定
      # - XRAY_ADDR=:80 # 覆蓋設定檔案中指定的監聽端口
    network_mode: service:code # 和 code 使用同一網路
```

上面的設定首先創建了一個 code 服務，它使用 linuxserver 打包的 code-server 環境用於提供代碼編寫環境。xray 服務則是本項目的 image，cap_add 是設置 iptables 必須的容器權限， network_mode 指定了和 code 使用同一網路，這樣在 xray 服務中設置的 iptables 規則也會被 code 服務使用。

# 代理網關

使用 docker 的另外一個好處是可以在 linux 下使用 docker 方便的創建一個代理網關，這樣只需要把家裏的設備的網關設置爲它就能訪問到朝鮮之外的網路(例如將 android 電視的網關設置爲它，就可以在 android 電視上使用 youtube 等程式)

首先需要宿主器是 linux 且爲 docker 使用 macvlan 模式聯網(這個模式依賴了linux 內核4.0以上，此外 macvlan 不能使用無線網關，因爲 wifi 協議禁止了這一行爲)。

下述假設網卡設備名稱是 **eth0**, 物理網卡所在的網路網關是 **192.168.1.1/24**

1. 首先爲網卡啓用混雜模式。（macvlan 會在物理網卡中虛擬一個新 mac 地址的網卡，混雜模式網卡才能接收這個 mac 地址的網路數據）

    ```
    ip link set eth0 promisc on
    ```

    使用下述指令查看是否啓用了混雜模式

    ```
    ip link |egrep eth0 | egrep PROMISC
    ```
2. 爲 docker 創建一個 macvlan 網路，並且啓用一個帶透明代理的容器

    ```
    networks:
      vlan:
        driver: macvlan
        driver_opts:
          parent: eth0
        ipam:
          config:
            - subnet: "192.168.1.0/24"
              gateway: "192.168.1.1"
    services:
      xray:
        image: king011/xray-webui:v0.0.4
        restart: always
        cap_add:
          - NET_ADMIN
          - NET_RAW
        environment:
          - XRAY_ADDR=:80
        networks:
          vlan:
            ipv4_address: 192.168.1.20
    ```

    上述 compose 創建了名爲 vlan 的 macvlan 網路，並且使用 xray-webui 容器創建了一個帶透明代理的網關。你可以訪問 http://192.168.1.20 來設置好透明代理，之後將要訪問網路的設備手動設置網關爲 192.168.1.20 即可讓設備透過 xray 容器訪問網路

> 注意上述設定中，宿主機無法訪問到 192.168.1.20，故只能是局域網內宿主機之外的其它網卡設備可以通過設置網關到 192.168.1.20 來訪問網路。