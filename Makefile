####
#
# Kampung
#
#
.PHONY: dev deploy

PORT=3333

dev:
	cd src && python3 -m http.server ${PORT}

deploy:
	cp -r src/* docs/
