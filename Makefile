PLUGIN_VERSION=0.1.1
PLUGIN_ID=hierarchical-charts

plugin:
	cat plugin.json|json_pp > /dev/null
	rm -rf dist
	mkdir dist
	zip --exclude "*.pyc" -r dist/dss-plugin-${PLUGIN_ID}-${PLUGIN_VERSION}.zip resource webapps plugin.json
