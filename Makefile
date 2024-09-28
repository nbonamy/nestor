
test:
	cd hub && npm test -- --run
	cd service && npm test -- --run
	cd client && npm test -- --run

install:
	cd hub && npm install
	cd service && npm install
	cd client && npm install
