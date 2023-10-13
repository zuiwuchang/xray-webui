package web

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var DefaultUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024 * 32,
	WriteBufferSize: 1024 * 32,
	CheckOrigin: func(r *http.Request) bool {
		// 允許跨域請求
		return true
	},
}

func (h Helper) CheckWebsocket(c *gin.Context) {
	if !c.IsWebsocket() {
		c.String(http.StatusBadRequest, `expect websocket`)
		c.Abort()
		return
	}
}
func (h Helper) Websocket(c *gin.Context, responseHeader http.Header) (ws *websocket.Conn, e error) {
	if !c.IsWebsocket() {
		c.String(http.StatusBadRequest, `expect websocket`)
		return
	}
	ws, e = DefaultUpgrader.Upgrade(c.Writer, c.Request, responseHeader)
	if e != nil {
		c.String(http.StatusBadRequest, e.Error())
		return
	}
	return
}
