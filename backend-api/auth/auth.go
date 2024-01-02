package auth

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"os"

	"github.com/golang-jwt/jwt"
)

func ParsePrivateKeyFromString(privateKeyPEM string) (interface{}, error) {
	// Decode the PEM-encoded private key
	block, _ := pem.Decode([]byte(privateKeyPEM))
	if block == nil {
		return nil, errors.New("failed to decode PEM block containing private key")
	}

	// Parse the RSA private key from the DER data
	privateKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}

	return privateKey, nil
}

func ParsePublicKeyFromString(publicKeyPEM string) (*rsa.PublicKey, error) {
	// Decode the PEM-encoded public key
	block, _ := pem.Decode([]byte(publicKeyPEM))
	if block == nil {
		return nil, errors.New("failed to decode PEM block containing public key")
	}

	// Parse the RSA public key from the DER data
	pubKey, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, err
	}

	rsaPubKey, ok := pubKey.(*rsa.PublicKey)
	if !ok {
		return nil, errors.New("parsed key is not an RSA public key")
	}

	return rsaPubKey, nil
}

func GenerateToken(claims map[string]interface{}) string {

	privateKey := fmt.Sprintf("-----BEGIN PRIVATE KEY-----\n%s\n-----END PRIVATE KEY-----", os.Getenv("RSA_Private_Secret_Key"))

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims(claims))

	// Sign and get the complete encoded token as a string using the secret
	pk, err := ParsePrivateKeyFromString(privateKey)
	if err != nil {
		fmt.Println(err)
		return ""
	}
	tokenString, err := token.SignedString(pk)
	if err != nil {
		fmt.Println(err)
		return ""
	}

	return tokenString
}

func ValidateToken(tokenString string) (map[string]interface{}, error) {
	publicKey := fmt.Sprintf("-----BEGIN PUBLIC KEY-----\n%s\n-----END PUBLIC KEY-----", os.Getenv("RSA_Public_Secret_Key"))

	var finalClaims = make(map[string]interface{})
	rsaPublicSecret, err := ParsePublicKeyFromString(publicKey)
	if err != nil {
		fmt.Println(err)
		return finalClaims, err
	}
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return rsaPublicSecret, nil
	})

	if err != nil {
		return finalClaims, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return finalClaims, errors.New("invalid token")
	}
	return claims, nil
}
