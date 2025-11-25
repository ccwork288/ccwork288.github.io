.PHONY: version

version: ## Bump version [major|minor|patch]
	@BUMP_TYPE="$(filter-out $@,$(MAKECMDGOALS))"; \
	if [ -z "$$BUMP_TYPE" ]; then \
		echo "Usage: make version [major|minor|patch]"; \
		exit 1; \
	fi; \
\
	VERSION=$$(cat version.txt); \
	MAJOR=$$(echo $$VERSION | cut -d. -f1); \
	MINOR=$$(echo $$VERSION | cut -d. -f2); \
	PATCH=$$(echo $$VERSION | cut -d. -f3); \
\
	case "$$BUMP_TYPE" in \
		major) \
			MAJOR=$$((MAJOR+1)); \
			MINOR=0; \
			PATCH=0; \
			;; \
		minor) \
			MINOR=$$((MINOR+1)); \
			PATCH=0; \
			;; \
		patch) \
			PATCH=$$((PATCH+1)); \
			;; \
		*) \
			echo "Invalid bump type: '$$BUMP_TYPE'. Use 'major', 'minor', or 'patch'."; \
			exit 1; \
			;; \
	esac; \
\
	NEW_VERSION="$$MAJOR.$$MINOR.$$PATCH"; \
	echo "Updating version from $$VERSION to $$NEW_VERSION"; \
	echo "$$NEW_VERSION" > version.txt; \
	#sed -i "" "s/%%VERSION%%/$$NEW_VERSION/g" script.js
