var templates = [
    "root/externallib/text!root/plugins/buttonblock/config.json",
    "root/externallib/text!root/plugins/buttonblock/layout.html",
    "root/externallib/text!root/plugins/buttonblock/link.html"
];

define(templates, function(config, layoutTpl, linkTpl) {
    // Returns a function that proxies the function handed in the parameter,
    // with the additional arguments sent to that proxied function.
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
        config:JSON.parse(config),
        display: function(area, buttons) {
            var values = {
                buttons:buttons
            };
            return MM.tpl.render(
                MM.plugins.buttonblock.templates[area].layout, values
            );
        },

        // Triggers a buttonblock:loaded event passing back the area that has
        // been loaded and the HTML associated with the area.
        load: function(area) {
            $(document).on(
                'buttonblock:template_loaded', MM.plugins.buttonblock._templateLoaded
            );
            var data = MM.plugins.buttonblock.config[area];
            if (data !== undefined) {
                // This allows us to call MM.plugins.buttonblock.[area].display
                // to get the HTML.
                MM.plugins.buttonblock[area] = {
                    display:partial(plugin.display, area, data.buttons)
                };
                MM.plugins.buttonblock.templates[area] = {};
                _.each(data.templates, function(template, templateName) {
                    require(["root/externallib/text!root/plugins/buttonblock/" + template], function(tpl) {
                        plugin.templates[area][templateName] = tpl;
                        $(document).trigger('buttonblock:template_loaded', [area, templateName]);
                    });
                });
            }
        },

        // Fired when an individual template is loaded via the require statement
        // in the load function above.
        _templateLoaded: function(event, area, templateName) {
            if (MM.plugins.buttonblock.config[area].loaded === undefined) {
                MM.plugins.buttonblock.config[area].loaded = 0;
            }
            MM.plugins.buttonblock.config[area].loaded++;

            // If we've loaded all the templates for a given area then trigger
            // that we have created the html for the specified area.
            if (MM.plugins.buttonblock.config[area].loaded === _.keys(MM.plugins.buttonblock.config[area].templates).length) {
                var html = MM.plugins.buttonblock[area].display();
                $(document).trigger('buttonblock:loaded', [area, html]);
            }
        },

        // Returns TRUE if the required template has already been loaded.
        // If it's already been loaded then the display function can be used.
        // Otherwise the triggered version needs to be used (load)
        exists:function(area) {
            return _.keys(MM.plugins.buttonblock.templates[area]).length > 0;
        }
    };

    var config = JSON.parse(config);
    _.each(config, function(data, area) {
        plugin[area] = {};
        plugin[area].display = partial(plugin.display, area, data.buttons);
        plugin.templates[area] = {};
        _.each(data.templates, function(template, templateName) {
            require(["root/externallib/text!root/plugins/buttonblock/" + template], function(tpl) {
                plugin.templates[area][templateName] = tpl;
            });
        });
    });

    MM.registerPlugin(plugin);
});