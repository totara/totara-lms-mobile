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

            for (var key in MM.plugins.totara_navigation.config.wantedPlugins) {
                var pluginName = MM.plugins.totara_navigation.config.wantedPlugins[key];
                var plugin = MM.plugins[pluginName];
                if (typeof plugin !== 'undefined') {
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

            // Render any button blocks
            var buttonblocks = $(document).find('#panel-left .buttonblock');
            _.each(buttonblocks, function(buttonblock) {
                var typeofblock = $(buttonblock).data('buttonblock');
                if (MM.plugins.buttonblock.exists(typeofblock)) {
                    $(buttonblock).append(MM.plugins.buttonblock[typeofblock].display());
                } else {
                    $(document).on('buttonblock:loaded', function(event, area, html) {
                        $(buttonblock).append(html);
                    });
                    MM.plugins.buttonblock.load(typeofblock);
                }
            });
        },

        // Creates and shows the side menu.
        show: function() {
            if (MM.navigation.visible === true) {
                return;
            }
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