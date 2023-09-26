{
  // 網頁顯示標題
  Title:'Xray WebUI',
  // 加載腳本
  Scripts: 'js/tproxy.js', // 將在 linux 下使用 tproxy 設置全局代理
  // Scripts: 'js/redirect.js', // 將在 linux 下使用 redirect 設置全局代理
  HTTP: import 'cnf/http.libsonnet',
  Logger: import 'cnf/logger.libsonnet',
}
