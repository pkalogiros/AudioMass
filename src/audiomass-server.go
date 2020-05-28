package main 

import (
  "net/http" 
  _ "net/url"
  "fmt"
  "os/exec"
  "strings"
  "time"
) 

func main() { 

  changeHeaderThenServe := func(h http.Handler) http.HandlerFunc { 
    return func(w http.ResponseWriter, r *http.Request) { 
      w.Header().Add("Access-Control-Allow-Origin", "*") 

      if strings.Contains(r.URL.Path, ".wasm") {
        w.Header().Add("Content-Type", "application/wasm")
      }

      if strings.Contains(r.URL.Path, ".js") {
      		var epoch = time.Unix(0, 0).Format(time.RFC1123)
      		var noCacheHeaders = map[string]string{
          			"Expires":         epoch,
          			"Cache-Control":   "no-cache, private, max-age=0",
          			"Pragma":          "no-cache",
          			"X-Accel-Expires": "0",
      		}

		      for k, v := range noCacheHeaders {
            		w.Header().Set(k, v)
        	}
      }

      fmt.Println("Req:", r.Host, r.URL.Path) 
      h.ServeHTTP(w, r) 
    }
  } 

  go func() {
    cmd := exec.Command("open", "-a", "Google Chrome", "http://localhost:5055/")
    cmd.Output()
  }()

  fmt.Printf("\nListening on http://localhost:5055 \n\n")
  http.Handle("/", changeHeaderThenServe(http.FileServer(http.Dir(".")))) 
  panic(http.ListenAndServe(":5055", nil)) 
}