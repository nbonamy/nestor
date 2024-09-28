
.PHONY: hub service client e2e install

test: hub service client e2e

hub:
	cd hub && npm test -- --run

service:
	cd service && npm test -- --run

client:
	cd client && npm test -- --run

e2e:
	./hub/node_modules/.bin/tsx tests/e2e.test.js

install:
	cd hub && npm install
	cd service && npm install
	cd client && npm install
