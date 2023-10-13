package web

import (
	"github.com/gin-gonic/gin"
)

type IHelper interface {
	Register(*gin.RouterGroup)
}
