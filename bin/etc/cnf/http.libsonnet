local def = import "def.libsonnet";
local size = def.Size;
local duration = def.Duration;
{
    // 服務器監聽地址
    Addr: ':9000',
    // x509證書，如果爲空創建 http 服務否則創建 https 服務
    CertFile: '',
    KeyFile: '',
    // 如果爲 true 在 /document/ 路徑下提供在線調試
    Swagger: true,
    // grpc 服務設定
    Option: {
        WriteBufferSize: 32*size.KB,
        ReadBufferSize: 32*size.KB,
        InitialWindowSize: 0*size.KB, // < 64k ignored
        InitialConnWindowSize: 0*size.KB, // < 64k ignored
        MaxRecvMsgSize: 0, // <1 4mb
        MaxSendMsgSize: 0, // <1 math.MaxInt32
    },
    // 如果非空使用 BasicAuth 驗證訪問權限
    Accounts: [
        {
            Name: "killer",
            Password: "19890604",
        },
    ],
}