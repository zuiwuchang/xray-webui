package configure

import "path/filepath"

type System struct {
	Title  string
	DB     string
	Script string
}

func (s *System) Format(basePath string) {
	if filepath.IsAbs(s.DB) {
		s.DB = filepath.Clean(s.DB)
	} else {
		s.DB = filepath.Clean(filepath.Join(basePath, s.DB))
	}

	if filepath.IsAbs(s.Script) {
		s.Script = filepath.Clean(s.Script)
	} else {
		s.Script = filepath.Clean(filepath.Join(basePath, s.Script))
	}
}
