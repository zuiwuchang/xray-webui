package utils

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
)

var basePath string

// BasePath return executable file directory
func BasePath() string {
	if basePath != `` {
		return basePath
	}
	filename, e := exec.LookPath(os.Args[0])
	if e != nil {
		if !errors.Is(e, exec.ErrDot) {
			panic(e)
		}
	}

	filename, e = filepath.Abs(filename)
	if e != nil {
		panic(e)
	}
	basePath = filepath.Dir(filename)
	return basePath
}

// Abs Use basePath as the working directory to return the absolute path
func Abs(basePath, path string) string {
	if filepath.IsAbs(path) {
		path = filepath.Clean(path)
	} else {
		path = filepath.Clean(filepath.Join(basePath, path))
	}
	return path
}
