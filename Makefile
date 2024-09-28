
.PHONY: testhub testservice testclient teste2e install build client service

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

service:
	cd service && npm run build

client:
	cd client && npm run build

build: service client

all: install build test
