.PHONY: install test build run docker-build docker-up

install:
	cd server && npm ci
	cd client && npm ci

test:
	cd server && npm test

build:
	cd client && npm run build

run:
	cd server && npm start & \
	cd client && npm start

docker-build:
	docker build -t food-rescue-server ./server
	docker build -t food-rescue-client ./client

docker-up:
	docker compose up --build