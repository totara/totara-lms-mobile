var templates = [
    "root/externallib/text!root/plugins/buttonblock/config.json",
    "root/externallib/text!root/plugins/buttonblock/layout.html",
    "root/externallib/text!root/plugins/buttonblock/link.html"
];

define(templates, function(config, layoutTpl, linkTpl) {
    function partial(func) { /* Can take any number of additional args */
        var args = Array.prototype.slice.call(arguments).splice(1);
        return function() {
            var allArguments = args.concat(Array.prototype.slice.call(arguments));
            return func.apply(this, allArguments);
        }
    };

    var plugin = {
        settings:{
            name: "buttonblock",
            type: "user",
            lang: {
                component: "core"
            }
        },
        templates:{
            layout:layoutTpl,
            link:linkTpl
        },
        display: function(area, buttons) {
            var values = {
                buttons:buttons
            };
            return MM.tpl.render(
                MM.plugins.buttonblock.templates[area].layout, values
            );
        }
    };

    var config = JSON.parse(config);
    _.each(config, function(data, area) {
        plugin[area] = {};
        plugin[area].display = partial(plugin.display, area, data.buttons);
        plugin.templates[area] = {};
        _.each(data.templates, function(template, templateName) {
            console.log("Loading template: " + template + " with name: " + templateName);
            require(["root/externallib/text!root/plugins/buttonblock/" + template], function(tpl) {
                plugin.templates[area][templateName] = tpl;
            });
        });
    });

    MM.registerPlugin(plugin);
});