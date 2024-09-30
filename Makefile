
.PHONY: testhub testservice testclient teste2e install build hub client service publish

test: testhub testservice testclient teste2e

testhub:
	cd hub && npm test -- --run

testservice:
	cd service && npm test -- --run

testclient:
	cd client && npm test -- --run

teste2e:
	./hub/node_modules/.bin/tsx tests/e2e.test.js

install:
	cd hub && npm install
	cd service && npm install
	cd client && npm install

hub:
	cd hub && npm test -- --run && npm run lint && npm run build

service:
	cd service && npm test -- --run && npm run lint && npm run build

client:
	cd client && npm test -- --run && npm run lint && npm run build

build: hub service client

all: install build test

publish: build
	cd hub && npm publish
	cd service && npm publish
	cd client && npm publish
