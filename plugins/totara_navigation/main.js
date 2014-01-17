var templates = [
    "root/externallib/text!root/plugins/totara_navigation/config.json",
    "root/externallib/text!root/plugins/totara_navigation/template.html"
];

require(templates, function(config, navTpl) {
    var plugin = {
        settings: {
            name: "totara_navigation",
            type: "menu",
            menuURL: "#",
            lang: {
                component: "core"
            }
        },

        templates:{
            side_nav:navTpl
        },

        menuWidth: 320,

        config:JSON.parse(config),

        /**
         * Sets up the top bar navigation.
         */
        init: function() {

        },

        populate: function() {
            var plugins = [];

            for (var el in MM.config.plugins) {
                var index = MM.config.plugins[el];
                var plugin = MM.plugins[index];
                if (typeof plugin == 'undefined') {
                    continue;
                }
                if (_.indexOf(
                        MM.plugins.totara_navigation.config.wantedPlugins,
                        plugin.settings.name
                    ) !== -1
                ) {
                    plugins.push(plugin.settings);
                }
            }

            // Prepare info for loading main menu.
            values = {
                user: {
                    fullname: MM.site.get('fullname'),
                    profileimageurl: MM.site.get('userpictureurl')
                },
                siteurl: MM.site.get('siteurl'),
                plugins: plugins
            };

            // Load the main menu template.
            var output = MM.tpl.render(
                MM.plugins.totara_navigation.templates.side_nav, values
            );

            MM.panels.html('left', output);
            MM.util.setupAccordion($("#panel-left"));

            // Links, when clicked, need to close the navigation.
            $('#default-navigation .is-link a.alink').on(MM.clickType, function(event){
                if (MM.touchMoving === true) {
                    return false;
                }
                // Hide the side menu
                MM.navigation.toggle();
                var link = $(event.target).closest('a').attr('href');
                var newUrl = document.location.href;

                // If we have an anchor link then replace the one that exists currently, if one does exist
                // else go directly to the link
                if (link.indexOf('#') !== -1) {
                    document.location.href = newUrl.indexOf('#') === -1 ? newUrl + link : newUrl.replace(/#.*$/, link);
                } else {
                    document.location.href = link;
                }
            });
        },

        // Creates and shows the side menu.
        show: function() {
            var panel = MM.config.menu_panel;
            $("#panel-left").show();

            if (MM.deviceType === "tablet") {
                $("#panel-center").css({
                    'left':'+=' + MM.plugins.totara_navigation.menuWidth,
                    'width':'-=' + MM.plugins.totara_navigation.menuWidth
                });
            } else if (MM.deviceType === "phone") {
                $("#panel-center").hide();

                $("#panel-left").css({
                    left: '0',
                    'width': '0'
                });

                $("#panel-left").css({
                    left: '0',
                    'width': '100%'
                });

            }
        },

        hide: function() {
            $("#panel-left").hide();
            $("#panel-center").css({
                left: '0',
                'width': '100%'
            });
            $("#panel-center").show();
        }
    };

    MM.registerPlugin(plugin);
});