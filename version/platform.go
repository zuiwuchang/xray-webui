package version

import (
	"fmt"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
)

var Platform = fmt.Sprintf(`%v %v %v gin%v`,
	runtime.GOOS, runtime.GOARCH, runtime.Version(),
	gin.Version[1:],
)

var ModTime time.Time

func init() {
	t, e := time.Parse(time.DateTime, Date)
	if e == nil {
		ModTime = t
	}
}
