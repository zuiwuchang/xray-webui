const { make } = require('./i18n');
exports.keys = {
    primeng: require('./primeng').primeng,
    home: make('H', '主頁'),
    subscription: make('s', '訂閱'),
    notfound: make('NF', '頁面未找到：'),
    sourcecode: make('SC', '源碼'),
    language: make('L', '語言'),
    theme: make('T', '主題'),
    about: make('A', '關於'),
    settings: make('S', '設定'),
    aboutText: make('AT', '關於內容文本'),
    aboutText1: make('AT1', '關於內容文本1'),
    menuSettings: {
        __id: '_ms',
        general: make('g', '常規'),
        strategy: make('s', '策略'),
        firewall: make('f', '防火牆'),
    },
    refresh: make('R', '刷新'),
    edit: make('E', '編輯'),
    delete: make('D', '刪除'),
    domain: make('D0', '域名'),
    strategy: {
        __id: '_s',
        default: make('d', '默認策略'),
        global: make('g', '全域代理'),
        public: make('p', '公網代理'),
        proxy: make('P', '代理優先'),
        korea: make('k', '直連優先'),
        direct: make('D', '直接連接'),

        tableHost: make('th', '設置靜態 IP，每行一個。格式爲 \'域名 + 分隔符 + IP + 分隔符 + IP...\'， 分隔符可以是 \'\\t,;\' 中任意字符或空格，如果行以 # 開始則忽略此行內容。'),
        tableProxy: make('tp', '這些 IP 和 域名 將使用代理訪問，多個值使用分隔符進行分隔，分隔符可以是 \'\n\t,;\' 中任意字符或空格，如果行以 # 開始則忽略此行內容。'),
        tableDirect: make('td', '這些 IP 和 域名 將被直接訪問，多個值使用分隔符進行分隔，分隔符可以是 \'\n\t,;\' 中任意字符或空格，如果行以 # 開始則忽略此行內容。'),
        tableBlock: make('tb', '這些 IP 和 域名 將被阻止訪問，多個值使用分隔符進行分隔，分隔符可以是 \'\n\t,;\' 中任意字符或空格，如果行以 # 開始則忽略此行內容。'),

        nameHost: make('nh', '靜態 IP'),
        nameProxy: make('np', '代理訪問'),
        nameDirect: make('nd', '直接訪問'),
        nameBlock: make('nb', '阻止訪問'),
    },
    button: {
        __id: '_b',
        submit: make('s', '提交'),
        close: make('c', '關閉'),
    },
    action: {
        __id: '_a',
        success: make('S', '成功'),
        error: make('E', '錯誤'),
        warn: make('W', '警告'),
        waitDataSave: make('ws', '正在存儲數據，請稍等。'),
        updated: make('U', '數據已更新'),
        save: make('s', '保存'),
        cancel: make('c', '取消'),
        add: make('a', '添加'),
        remove: make('R', "數據一旦刪除將無法恢復，請確認？"),
        removeSuccess: make('r', '數據刪除成功'),
    },
    general: {
        __id: '_g',
        url: make('u', '速度測試網址'),
        run: make('r', '自動運行代理服務'),
        firewall: make('f', '自動設置全局代理'),
        strategy: make('s', '策略'),
        custom: make('c', '自定義設定')
    },
    name: make('N', '名稱'),
    url: make('U', '網址'),
    invalid: {
        __id: '_i',
        name: make('n', '名稱不能爲空白'),
        url: make('u', '訂閱網址必須是 http 或 https'),
    },
    proxy: {
        __id: '_p',
        element: make('E', '代理節點'),
        none: make('N', '服務尚未啓動'),
        started: make('S', '服務已經啓動'),
        manual: make('M', '手動節點'),

        sort: make('s', '速度排序'),
        test: make('t', '測試速度'),
        add: make('a', '添加節點'),
        clear: make('ca', '清空節點'),
        qr: make('q', '分享二維碼'),
        copy: make('c', '複製鏈接'),
        update: make('u', '更新訂閱'),
    },
}
