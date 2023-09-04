package auth

import (
	"fmt"
	"os"

	"github.com/golang-jwt/jwt"
)

var hmacSecret []byte = []byte(os.Getenv("Secret_Key"))

func GenerateToken(claims map[string]interface{}) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims(claims))

	// Sign and get the complete encoded token as a string using the secret
	tokenString, err := token.SignedString(hmacSecret)
	if err != nil {
		return ""
	}

	return tokenString
}

func ValidateToken(tokenString string) map[string]interface{} {
	var finalClaims = make(map[string]interface{})
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {

		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}

		// hmacSampleSecret is a []byte containing your secret, e.g. []byte("my_secret_key")
		return hmacSecret, nil
	})

	if err != nil {
		return finalClaims
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return finalClaims
	}
	return claims
}
