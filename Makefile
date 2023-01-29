.PHONY: build
build:
	-docker buildx create --name homethingy-frontend-builder --driver docker-container --bootstrap --platform linux/amd64,linux/arm64
	docker buildx use homethingy-frontend-builder
	docker buildx build --platform linux/amd64,linux/arm64 .
	docker buildx build -t homethingy-frontend --load .
