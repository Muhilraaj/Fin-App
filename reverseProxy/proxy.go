package main

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
)

func backendProxy(c *gin.Context) {
	remote, err := url.Parse("https://myfinapp18-dev.azurewebsites.net")
	if err != nil {
		panic(err)
	}

	proxy := httputil.NewSingleHostReverseProxy(remote)
	proxy.Director = func(req *http.Request) {
		req.Header = c.Request.Header
		req.Host = remote.Host
		req.URL.Scheme = remote.Scheme
		req.URL.Host = remote.Host
		req.URL.Path = c.Request.URL.Path
	}

	fmt.Println(c.Request.URL.Path)

	proxy.ServeHTTP(c.Writer, c.Request)
}

func frontendProxy(c *gin.Context) {
	remote, err := url.Parse("https://happy-glacier-0b5d60d10.3.azurestaticapps.net")
	if err != nil {
		panic(err)
	}

	proxy := httputil.NewSingleHostReverseProxy(remote)
	proxy.Director = func(req *http.Request) {
		req.Header = c.Request.Header
		req.Host = remote.Host
		req.URL.Scheme = remote.Scheme
		req.URL.Host = remote.Host
		req.URL.Path = c.Request.URL.Path
	}

	fmt.Println(c.Request.URL.Path)

	proxy.ServeHTTP(c.Writer, c.Request)
}

func main() {
	route := gin.Default()
	route.Any("/api/*path", backendProxy)
	route.Any("/page/*path", frontendProxy)
	route.GET("/static/*path", frontendProxy)
	route.GET("/manifest.json", frontendProxy)
	route.GET("/logo192.png", frontendProxy)
	route.Run(":443")
}
