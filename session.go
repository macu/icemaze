package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

var randGen = rand.New(rand.NewSource(time.Now().UnixNano()))
var randMutex = &sync.Mutex{}

const letters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

func makeSessionID() string {
	bytes := make([]byte, 9)
	randMutex.Lock()
	for i := range bytes {
		bytes[i] = letters[randGen.Intn(len(letters))]
	}
	randMutex.Unlock()
	// 20 digits (current time) + 1 (:) + 9 (random) = 30 digit session ID
	return fmt.Sprintf("%020d:%s", time.Now().UnixNano(), string(bytes))
}
