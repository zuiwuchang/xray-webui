package static

import (
	"embed"
	"io/fs"
	"net/http"
)

var LICENSE embed.FS

//go:embed document/*
var document embed.FS

func Document() http.FileSystem {
	f, e := fs.Sub(document, `document`)
	if e != nil {
		panic(e)
	}
	return http.FS(f)
}

//go:embed public/*
var static embed.FS

func Static() http.FileSystem {
	f, e := fs.Sub(static, `public`)
	if e != nil {
		panic(e)
	}
	return http.FS(f)
}

//go:embed view/*
var view embed.FS

func View() http.FileSystem {
	f, e := fs.Sub(view, `view`)
	if e != nil {
		panic(e)
	}
	return http.FS(f)
}
