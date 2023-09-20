local def = import "def.libsonnet";
local size = def.Size;
local duration = def.Duration;
{
    // http addr
    Addr: ':9000',
    // if not empty use https
    CertFile: '',
    KeyFile: '',
    // enable swagger-ui on /document/
    Swagger: true,
    // grpc server option
    Option: {
        WriteBufferSize: 32*size.KB,
        ReadBufferSize: 32*size.KB,
        InitialWindowSize: 0*size.KB, // < 64k ignored
        InitialConnWindowSize: 0*size.KB, // < 64k ignored
        MaxRecvMsgSize: 0, // <1 4mb
        MaxSendMsgSize: 0, // <1 math.MaxInt32
        MaxConcurrentStreams: 0,
    },
}