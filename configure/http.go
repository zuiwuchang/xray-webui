package configure

// HTTP configure
type HTTP struct {
	Addr string

	CertFile string
	KeyFile  string

	Swagger bool

	Option ServerOption

	Accounts []Account
}

// H2 if tls return true
func (h *HTTP) H2() bool {
	return h.CertFile != `` && h.KeyFile != ``
}

// H2C if not use tls return true
func (h *HTTP) H2C() bool {
	return h.CertFile == `` || h.KeyFile == ``
}

type ServerOption struct {
	WriteBufferSize, ReadBufferSize          int
	InitialWindowSize, InitialConnWindowSize int32
	MaxRecvMsgSize, MaxSendMsgSize           int
	MaxConcurrentStreams                     uint32
}

type Account struct {
	Name     string
	Password string
}
