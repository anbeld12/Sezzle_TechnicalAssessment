package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"calculator-backend/internal/api"
	"calculator-backend/internal/calculator"

	_ "calculator-backend/docs"
)

// @title           Sezzle Calculator Microservice API
// @version         1.0
// @description     Production-grade REST API for basic and advanced arithmetic operations.
// @BasePath        /
// @schemes         http
func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := fmt.Sprintf(":%s", port)

	engine := calculator.NewEngine()
	router := api.NewRouter(engine)

	server := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	shutdownChan := make(chan os.Signal, 1)
	signal.Notify(shutdownChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		slog.Info("starting calculator microservice", "address", addr, "swagger", fmt.Sprintf("http://localhost:%s/swagger/index.html", port))
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server listen error", "error", err)
			os.Exit(1)
		}
	}()

	<-shutdownChan
	slog.Info("shutdown signal received; commencing graceful termination")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		slog.Error("server forced shutdown error", "error", err)
		os.Exit(1)
	}

	slog.Info("server exited cleanly")
}
