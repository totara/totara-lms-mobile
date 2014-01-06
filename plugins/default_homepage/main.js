var templates = [
    "root/externallib/text!root/plugins/default_homepage/homepage.html"
];

require(templates, function(mainTpl) {
    var plugin = {
        settings: {
            name: "default_homepage",
            type: "general",
            title: "Homepage",
            icon: "",
            lang: {
                component: "core"
            },
            menuurl:"#homepage"
        },

        templates: {
            main: mainTpl
        },

        routes: [,
            ["homepage", "homepage", "main"]
        ],

        sizes: undefined,

        _getSizes: function() {
            MM.plugins.default_homepage.sizes = {
                withSideBar: {
                    center:$(document).innerWidth() - MM.navigation.getWidth(),
                    left:MM.navigation.getWidth()
                },
                withoutSideBar: {
                    center:$(document).innerWidth(),
                    left:0
                }
            };
        },

        resize: function() {
            if (MM.plugins.default_homepage.sizes == undefined) {
                MM.plugins.default_homepage._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.default_homepage.sizes.withSideBar.center,
                    'left':MM.plugins.default_homepage.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.default_homepage.sizes.withoutSideBar.center,
                    'left':MM.plugins.default_homepage.sizes.withoutSideBar.left
                });
            }
            $("#panel-right").hide();
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").show();
        },

        /**
         * c'tor
         */
        init:function() {

        },

        main: function() {
            // Grab homepage from web service and display on page
            var method = "core_webservice_get_mobile_homepage";
            var data = {};
            var callback = MM.homepage.loadSuccess;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.homepage.loadFailure;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        loadSuccess: function(response) {
            MM.Router.route('#homepage');

            var values = {
                content:response
            };

            // Load the main menu template.
            var output = MM.tpl.render(
                MM.plugins.default_homepage.templates.main, values
            );

            MM.panels.html('center', output);

            $(".view-menu").on(MM.clickType, function() {
                var visible = MM.navigation.toggle();
                if (MM.deviceType == 'tablet') {
                    if (visible) {
                        $(".view-menu").html(MM.lang.s("home-viewmenu-close"));
                    } else {
                        $(".view-menu").html(MM.lang.s("home-viewmenu-show"));
                    }
                }
            });
        },

        loadFailure: function(xhr, statusText) {
            MM.log(xhr);
            MM.log(statusText);
        }
    }

    MM.registerPlugin(plugin);
});