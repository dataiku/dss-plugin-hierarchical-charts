PLUGIN_VERSION=0.1.0
PLUGIN_ID=dss-plugin-hierarchical-charts

plugin:
	cat plugin.json|json_pp > /dev/null
	rm -rf dist
	mkdir dist
	zip --exclude "*.pyc" -r dist/dss-plugin-${PLUGIN_ID}-${PLUGIN_VERSION}.zip webapps plugin.json 