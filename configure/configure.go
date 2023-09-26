package configure

import (
	"encoding/json"

	"github.com/google/go-jsonnet"
	"github.com/zuiwuchang/xray_webui/log"
)

var defaultConfigure Configure

// return default Configure
func Default() *Configure {
	return &defaultConfigure
}

type Configure struct {
	Title  string
	Script string
	HTTP   HTTP
	Logger log.Options
}

func (c *Configure) String() string {
	if c == nil {
		return "nil"
	}
	b, e := json.MarshalIndent(c, ``, `	`)
	if e != nil {
		return e.Error()
	}
	return string(b)
}

func (c *Configure) Load(filename string) (e error) {
	vm := jsonnet.MakeVM()
	jsonStr, e := vm.EvaluateFile(filename)
	if e != nil {
		return
	}
	e = json.Unmarshal([]byte(jsonStr), c)
	if e != nil {
		return
	}
	return
}
