####
#
# Kampung
#
#
.PHONY: dev

PORT=3333

dev:
	cd src && python3 -m http.server ${PORT}

