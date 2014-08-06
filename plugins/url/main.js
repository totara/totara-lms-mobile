var templates = [
    "root/externallib/text!root/plugins/url/url.html"
];

define(templates, function(urlTpl) {
    var plugin = {
        settings: {
            name: "url",
            type: "user",
            lang: {
                component: "core"
            },
            menuURL: "#"
        },

        templates: {
            url: { html: urlTpl }
        },

        routes: [
            ["url/:cmid", "url", "url"]
        ],

        sizes: undefined,

        _getSizes: function() {
            // Default tablet.
            MM.plugins.url.sizes = {
                withSideBar: {
                    center:$(document).innerWidth() - MM.navigation.getWidth(),
                    left:MM.navigation.getWidth()
                },
                withoutSideBar: {
                    center:$(document).innerWidth(),
                    left:0
                }
            };

            if (MM.deviceType === "phone") {
                MM.plugins.url.sizes = {
                    withSideBar: {
                        center:0,
                        left:0
                    },
                    withoutSideBar: {
                        center:"100%",
                        left:0
                    }
                };
            }
        },

        resize: function() {
            if (MM.plugins.url.sizes == undefined) {
                MM.plugins.url._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.url.sizes.withSideBar.center,
                    'left':MM.plugins.url.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.url.sizes.withoutSideBar.center,
                    'left':MM.plugins.url.sizes.withoutSideBar.left
                });
            }

            if (MM.deviceType === "phone") {
                $("#panel-center").css({
                    'width':'100%',
                    'left':0
                });
            }

            $("#panel-right").hide();
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").show();
        },

        url: function(cmid) {
            MM.assignCurrentPlugin(MM.plugins.url);
            MM.panels.showLoading("center");
            var method= "mod_url_get_url_details";
            var data = { cmid: cmid };
            var callback = MM.plugins.url.urlDetailsCallback;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.course.errorCallback;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        urlDetailsCallback: function(response) {
            var url = response;
            var template = MM.plugins.url.templates.url;
            var context = {url: url};
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
            MM.util.setupBackButton();
        }

    }

    MM.registerPlugin(plugin);
});
