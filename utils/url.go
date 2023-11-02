package utils

import (
	"net/url"
	"strings"
)

func ParseRequestURI(rawURL string) (u *url.URL, e error) {
	fragment := ``
	found := strings.LastIndex(rawURL, `#`)
	if found > 0 {
		fragment = url.QueryEscape(rawURL[found+1:])
		rawURL = rawURL[:found]
	}

	u, e = url.ParseRequestURI(rawURL)
	if e != nil {
		return
	}
	u.Fragment = fragment
	return
}
