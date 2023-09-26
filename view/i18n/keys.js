const { make } = require('./i18n');
exports.keys = {
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
        __id: 'ms',
        general: make('g', '常規'),
        strategy: make('s', '策略'),
        firewall: make('f', '防火牆'),
    }
}
