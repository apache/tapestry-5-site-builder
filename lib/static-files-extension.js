/*
= Extension for publishing static files as-is

Publishes every file below `static/` in the content repository's `main`
component to the site root, keeping its path relative to `static/`.

Antora only publishes files inside a module family, and those always end up
below `<component>/<version>/`. Files that must stay at fixed root URLs, like
the template schemas, DTDs, or the archetype catalog, can't be published that
way.

== Example
static/schema/tapestry_5_4.xsd -> /schema/tapestry_5_4.xsd

based on the example https://docs.antora.org/antora/latest/extend/extensions/
*/

const COMPONENT_NAME = 'main';
const STATIC_DIR = 'static/';

module.exports.register = function () {
    this.once('contentAggregated', ({ contentAggregate, siteCatalog }) => {
        contentAggregate
            .filter((componentVersion) => componentVersion.name === COMPONENT_NAME)
            .forEach((componentVersion) => {
                componentVersion.files = componentVersion.files.filter((file) => {
                    if (!file.path.startsWith(STATIC_DIR)) return true
                    file.out = { path: file.path.slice(STATIC_DIR.length) }
                    siteCatalog.addFile(file)
                    return false
                })
            })
    })
}
